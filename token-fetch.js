// Setup: npm install alchemy-sdk
const { Alchemy, Network } = require('alchemy-sdk');

const config = {
  apiKey: '7d7ySvtb71nK18LkAxa6BYzzEgDC4i2S',
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

const main = async () => {
  // Wallet address
  const address = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

  // Get token balances
  const balances = await alchemy.core.getTokenBalances(address);

  console.log(`The balances of ${address} address are:`, balances);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
