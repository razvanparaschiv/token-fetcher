import {CoinGeckoClient, CoinMarketChartResponse} from 'coingecko-api-v3';
import {BasicCoin} from "coingecko-api-v3/dist/Interface";
import {inMemoryCache} from "@/libs/Cache";
import {getCoinGeckoApiKey} from "@/utils/Helpers";
import {pRateLimit} from "p-ratelimit";

export const geckoClient = new CoinGeckoClient({
        timeout: 10000,
        autoRetry: true,
    },
    getCoinGeckoApiKey() // Leave it undefined! This coingecko client does not work with a DEMO apiKey
);

const TOKE_PRICE_TTL = 60 * 60 * 12;
const COIN_LIST_TTL = 60 * 60 * 24;

const limit = pRateLimit({
    interval: 60000, // 1000 ms == 1 second
    rate: 30, // 40 API calls per interval
    concurrency: 10, // no more than 15 running at once
});

export const getCoinList = async (): Promise<Map<string, BasicCoin>> => {
    if (inMemoryCache.has('coinList')) {
        return inMemoryCache.get('coinList')!;
    }
    const coinList: BasicCoin[] = await limit(() => geckoClient.coinList({}));

    const coinListMap = coinList.reduce((agg, token) => {
        if (token.symbol) {
            agg.set(token.symbol, token);
        }

        return agg;

    }, new Map<string, BasicCoin>());

    inMemoryCache.set('coinList', coinListMap, COIN_LIST_TTL);

    return coinListMap;
}

export const getMarketData = async (input: {
    id: string;
    vs_currency: string;
    from: number;
    to: number;
}) => {
    const cacheKey = `${input.id}_${input.vs_currency}_${input.from}_${input.to}`;
    if (inMemoryCache.has(cacheKey)) {
        return inMemoryCache.get(cacheKey) as CoinMarketChartResponse;
    }
    const priceData = await limit(() => geckoClient.coinIdMarketChartRange(input));

    inMemoryCache.set(cacheKey, priceData, TOKE_PRICE_TTL);

    return priceData;
}


