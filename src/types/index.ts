export interface ERC20TransactionExtended {
    chain: string;
    address: string;
    blockNumber: string;
    toAddress: string;
    fromAddress: string;
    value: string;
    transactionHash: string;
    blockTimestamp: Date;
    blockHash: string;
    transactionIndex: number;
    logIndex: number;
    possibleSpam: boolean;
    tokenName: string
    valueDecimal: string;
    tokenSymbol: string;
}

export enum TransferDirection {
    IN,
    OUT
}
export interface Transfer {
    direction: TransferDirection,
    amount: number;
    time: Date,
    symbol: string;
}

export interface Walletstats {
    totalValueUSD: string,
    tokenHoldings: Record<string, string>,
    summaryLastMonth?: {
        totalInUSD: string,
        totalOutUSD: string
    }
}