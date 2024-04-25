import Moralis from "moralis";
import {EvmChain, EvmErc20TokenBalanceWithPrice, EvmTransaction} from "@moralisweb3/common-evm-utils";
import BigNumber from "bignumber.js";
import moment, {Moment} from "moment";
import {CoinMarketChartResponse} from "coingecko-api-v3";
import {getMoralisApiKey, isPromiseRejected} from "@/utils/Helpers";
import {getCoinList, getMarketData} from "@/services/TokenPricing";
import {ERC20TransactionExtended, Transfer, TransferDirection, Walletstats} from "@/types";


Moralis.start({
    apiKey: getMoralisApiKey()
})

export const getAddressBalance = async (address: string, chain = EvmChain.ETHEREUM) => {
    let cursor = undefined;
    let result: EvmErc20TokenBalanceWithPrice[] = [];

    do {
        const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
            chain,
            address,
            excludeSpam: true,
            cursor
        });

        result = result.concat(response.result);
        cursor = response.pagination.cursor;

    } while (cursor !== null && cursor !== "")

    return result;
}

const getAddressActivity = async (address: string, chain = EvmChain.ETHEREUM, fromDate: string, toDate: string) => {
    const nativeTransfers = await getAddressNativeCurrencyTransfers(address, chain, fromDate, toDate);
    const erc20Transfers = await getAddressERC20Transfers(address, chain, fromDate, toDate);

    const transfers: Transfer[] = [
            ...erc20Transfers.map(transfer => ({
            direction: transfer.fromAddress === address ? TransferDirection.OUT : TransferDirection.IN,
            amount: parseFloat(transfer.valueDecimal) || 0,
            time: transfer.blockTimestamp,
            symbol: transfer.tokenSymbol
        })),
        ...nativeTransfers.map(transfer => ({
            direction: transfer.from.toJSON() === address ? TransferDirection.OUT : TransferDirection.IN,
            amount: parseFloat(transfer.value?.ether || '0'),
            time: transfer.blockTimestamp,
            symbol: 'ETH'
        })),
    ]
        .filter(t => t.amount !== 0);

    return transfers;
}

const getAddressNativeCurrencyTransfers = async (
    address: string,
    chain = EvmChain.ETHEREUM,
    fromDate: string,
    toDate: string
) => {
    let cursor = undefined;
    let result: EvmTransaction[] = [];

    do {
        const response = await Moralis.EvmApi.transaction.getWalletTransactions({
            chain,
            address,
            cursor,
            fromDate,
            toDate
        });

        result = result.concat(response.result);
        cursor = response.pagination.cursor;

    } while (cursor !== null && cursor !== "")

    return result;
}

const getAddressERC20Transfers = async (
    address: string,
    chain = EvmChain.ETHEREUM,
    fromDate: string,
    toDate: string
) => {
    let cursor = undefined;
    let result: ERC20TransactionExtended[] = [];

    do {
        const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
            chain,
            address,
            cursor,
            fromDate,
            toDate
        });

        result = result.concat(
            response.result.map(t => t.toJSON()) as ERC20TransactionExtended[]
        ); // Do this because Moralis tyoes are outdates
        cursor = response.pagination.cursor;

    } while (cursor !== null && cursor !== "")

    return result;
}

export const getWalletTokenStats = async (address: string) => {
    const addressBalance = await getAddressBalance(address);

    const balanceAggregation = addressBalance.reduce(
        ({totalValueUSD, tokenHoldings}, current) => {
            if (current.symbol === null) {
                return {totalValueUSD, tokenHoldings};
            }
            if (!tokenHoldings[current.symbol]) {
                tokenHoldings[current.symbol] = new BigNumber(current.balanceFormatted);
            } else {
                tokenHoldings[current.symbol] = tokenHoldings[current.symbol]!.add(new BigNumber(current.balanceFormatted));
            }

            totalValueUSD += current.usdValue;

            return {
                totalValueUSD,
                tokenHoldings
            }
        },
        {
            totalValueUSD: 0,
            tokenHoldings: {}
        } as {totalValueUSD: number, tokenHoldings: Record<string, BigNumber>});

    const tokenHoldings: Record<string, string> = {};

    for (const key in balanceAggregation.tokenHoldings) {
        tokenHoldings[key] = balanceAggregation.tokenHoldings[key]!.toFixed(3);
    }

    return {
        totalValueUSD: balanceAggregation.totalValueUSD.toString(),
        tokenHoldings,
    }

}

export const getWalletStats = async (address: string): Promise<Walletstats> => {

    const walletTokenStats = await getWalletTokenStats(address);

    // It's important to set the start of the day so that we can cache responses
    const fromDate = moment().subtract(1, 'month').startOf('day');
    const toDate = moment().startOf('day');

    const summaryLastMonth = await getWalletLastMonthActivity(address, fromDate, toDate);

    return {
        ...walletTokenStats,
        summaryLastMonth

    }
}

export const getWalletLastMonthActivity = async (address: string, fromDate: Moment, toDate: Moment) => {
    const transfers = await getAddressActivity(
        address,
        EvmChain.ETHEREUM,
        fromDate.format('YYYY-MM-DD'),
        toDate.format('YYYY-MM-DD')
    );

    const coinListMap = await getCoinList();

    let transferredTokensIds = transfers
        .map(t => t.symbol)
        .filter(s => !!s)
        .map(t => coinListMap.get(t.toLowerCase()))
        .filter(c => c && c.id);

    transferredTokensIds = [... new Set(transferredTokensIds)];
    const pricePromises: (() => Promise<CoinMarketChartResponse>)[] = [];

    transferredTokensIds.forEach(c => pricePromises.push(() => getMarketData({
        id: c!.id!,
        vs_currency: 'usd',
        from: fromDate.unix(),
        to: toDate.unix()
    })));

    console.log("Fetching prices. This may take a while...")
    const pricesResponses = await Promise.allSettled(pricePromises.map(p => p()))

    const pricesMap = transferredTokensIds.reduce((agg, curr, idx) => {
        const promise = pricesResponses[idx]!;

        if (!isPromiseRejected(promise)) {
            agg.set(curr!.id!, promise.value);
        }

        return agg;

    }, new Map<string, CoinMarketChartResponse>())
    console.log("Prices fetched!")

    const {totalInUsd, totalOutUsd} = transfers.reduce((agg, t) => {
        const coinData = coinListMap.get(t.symbol.toLowerCase());
        const {totalInUsd, totalOutUsd} = agg;

        if (!coinData || !coinData.id) {
            return agg;
        }
        const prices = pricesMap.get(coinData.id);

        if (!prices?.prices) {
            return agg;
        }
        const amount = t.amount
            * (findPrice(prices.prices as [number, number][], Math.floor(t.time.getTime())) || 0);

        return t.direction === TransferDirection.IN ? {
            totalInUsd: totalInUsd + amount,
            totalOutUsd,
        } : {
            totalInUsd,
            totalOutUsd: totalOutUsd + amount,
        };
    }, {
        totalInUsd: 0,
        totalOutUsd: 0,
    });

    return {
        totalInUSD: totalInUsd.toString(),
        totalOutUSD: totalOutUsd.toString(),
    }
}

export const findPrice = (tokenMarketPrice: Array<[number, number]>, timestamp: number): number | null => {
    const firstGreaterTimePrice = tokenMarketPrice.findLast(p => p[0] <= timestamp);
    if (!firstGreaterTimePrice) {
        return null;
    }

    return firstGreaterTimePrice[1];
}

