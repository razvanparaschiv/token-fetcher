export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

export const getCoinGeckoApiKey = () => {
  const coinGeckoApiKey = process.env.COINGECKO_API_KEY;

  return coinGeckoApiKey
}

export const getMoralisApiKey = () => {
  const moralisApiKey = process.env.MORALIS_API_KEY;
  if (!moralisApiKey) {
    throw new Error(`Environment variable is required MORALIS_API_KEY`)
  }

  return moralisApiKey;
}

export function isPromiseRejected<T>(promiseResult: PromiseFulfilledResult<T> | PromiseRejectedResult): promiseResult is PromiseRejectedResult {
  return promiseResult.status === "rejected";
}
