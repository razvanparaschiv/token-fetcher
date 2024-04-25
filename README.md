# Wallet Acitivity API

## Features
This NextJS application provides an endpoint that exposes the following data

- Wallet total value in USD
- All token holdings (currently implemented for the Ethereum network)
- The approximate amount of dollars spent and recieved during the past month

### How to run and test the application

Run the following command on your local environment:

```shell
git clone --depth=1 https://github.com/razvanparaschiv/token-fetcher.git my-project-name
cd my-project-name
npm install
```

Then, you can run the project locally in development mode with live reload by executing:

```shell
npm run dev
```

### Test the application

Call the endpoint that resides at ``/api/wallet`` in order to obtain the aforementioned data 
for the wallet provided in the http call body under `walletAddress` property.

### Test the application

Example API call

```
curl --location 'http://localhost:3000/api/wallet' \
--header 'Content-Type: application/json' \
--header 'Cookie: NEXT_LOCALE=en' \
--data '{
    "walletAddress": "0x4C4749c79374Ee9290f63D152602A97FF5a73687"
}'
```

# Architecture and additional comments

## Blockchain Information
- Initially it fetches the holdings of the wallet and transforms them to a proper API response
- Fetches all the ERC20 transfers for the past month
- Fetches all the native transfers for the past month

## Pricing Information
- It fetches through the Coingecko free API all the market chart data for the past month
- It aggregates and finds the approximate prices of the token based on the transfers fetches 
during the blockchain data gathering step

## Technologies used


### Moralis

Since this is a demo project, I chose Moralis due to the fact that it offers a robust and quick to use SDK.
Additionally, the Moralis SDK offers the exact APIs needed for this project

### Coingecko

Not a lot to add here. Chose one of the most popular crypto analytics providers

### Caching
A proper caching implementation would be represented by a caching solution with persistent storage such as Redis.
Due to the nature of this project, I chose an in memory cache mechanism. The data caches within this wallet stats endpoint
is represented by:
- coingecko coin ids list
- The API response for a specific wallet (This is not the best approach as users may transfer their assets in the meantime or 
the assets price evolution would change. That is why I chose a small cache ttl for this)

### Request throttling
Coingecko has a rate limit on their APIs. The pricing requests are wrapped inside a request throttler so we don't hit 429 statuses

### Project structure

```shell
.
├── README.md                       # README file
├── scripts                         # Scripts folder
├── src
│   ├── app                         # Next JS App (App Router)
│   ├── services                    # Services used to implement the application logic
│   ├── libs                        # 3rd party libraries configuration
│   ├── types                       # Type definitions
│   ├── utils                       # Utilities folder
│   └── validations                 # Validation schemas
├── tests                           # Unit tests
└── tsconfig.json                   # TypeScript configuration
```
## Improvements

This is a DEMO application, thus in order to be scaled it would need some additional work to be done.
Moralis is not always the best alternative as it can become quite inflexible and costly. In order to tackle this scenario,
a custom block scanner should be set in place. The wallet address will be initially saved in order to be tracked. Anytime
the tracker would find a blockchain log correspondent to the specific address it would update the balance and price stats 
of the specific wallet.