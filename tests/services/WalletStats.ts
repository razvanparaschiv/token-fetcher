import {findPrice} from "@/services/WalletStats";

describe('findPrice', () => {
    const tokenMarketPrice = [
        [1713848434940, 24889262031.298702],
        [1713852338996, 24336417274.332302],
        [1713855883240, 18568764161.997883],
        [1713859372447, 23756103507.65243],
        [1713862975109, 24002302060.141193],
        [1713866620396, 17154356751.56371],
        [1713870199732, 19022149753.842957],
        [1713873649780, 24156989721.271538],
        [1713877406092, 24109110167.87672],
        [1713881178881, 19665547914.896263],
        [1713884578765, 20348081716.871758],
        [1713888095278, 23444935981.082264],
        [1713891630673, 19772272772.840633],
        [1713895541531, 18970625024.344532],
        [1713899035478, 18508442896.756405],
        [1713902677633, 22806717166.4696],
        [1713906063918, 24648613699.968296],
        [1713909849299, 24668094130.889538]
    ] as [number, number][];

    it('should return null if timestamp is before the earliest available data', () => {
        const timestamp = 1000000000000; // A timestamp before any data
        expect(findPrice(tokenMarketPrice, timestamp)).toBe(null);
    });

    it('should return null if no price is available before the given timestamp', () => {
        const timestamp = 1713848434939; // A timestamp before the first available data
        expect(findPrice(tokenMarketPrice, timestamp)).toBe(null);
    });

    it('should return the correct price for the given timestamp', () => {
        const timestamp = 1713862975108; // A timestamp between two available data points
        expect(findPrice(tokenMarketPrice, timestamp)).toBe(23756103507.65243);
    });

    it('should return the correct price for the earliest available timestamp', () => {
        const timestamp = 1713848434940; // The earliest available timestamp
        expect(findPrice(tokenMarketPrice, timestamp)).toBe(24889262031.298702);
    });

    it('should return the correct price for the latest available timestamp', () => {
        const timestamp = 1713909849299; // The latest available timestamp
        expect(findPrice(tokenMarketPrice, timestamp)).toBe(24668094130.889538);
    });

    it('should return the correct price for a timestamp exactly matching a data point', () => {
        const timestamp = 1713862975109; // A timestamp exactly matching a data point
        expect(findPrice(tokenMarketPrice, timestamp)).toBe(24002302060.141193);
    });
});

jest.mock('@/services/WalletStats', () => {
    const originalModule = jest.requireActual('@/services/WalletStats');

    return {
        ...originalModule,
        getAddressBalance: jest.fn().mockResolvedValue([
            {
                symbol: 'DOP',
                balanceFormatted: '561.312',
                usdValue: 100 // Example usdValue for testing
            },
            {
                symbol: 'XELO',
                balanceFormatted: '176.211453',
                usdValue: 50 // Example usdValue for testing
            }
        ])
    };
});

import {getWalletTokenStats} from "@/services/WalletStats";



// Importing after mocking
// Ensure getAddressBalance is also imported if it's used directly in getWalletTokenStats

describe('getWalletTokenStats', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return total value in USD and token holdings', async () => {
        const walletTokenStats = await getWalletTokenStats('0x4C4749c79374Ee9290f63D152602A97FF5a73687');

        expect(walletTokenStats).toEqual({
            totalValueUSD: '150', // Sum of the example usdValue
            tokenHoldings: {
                DOP: '561.312',
                XELO: '176.211'
            }
        });
        // You might need to adjust this depending on how getAddressBalance is used within getWalletTokenStats
        expect(getAddressBalance).toHaveBeenCalledWith('0x4C4749c79374Ee9290f63D152602A97FF5a73687');
    });

});



