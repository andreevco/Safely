import * as bitcoin from 'bitcoinjs-lib';

export enum BTC_WALLET_TYPE {
    NATIVE_SEGWIT = 'NATIVE_SEGWIT'
}

export enum BTC_NETWORK {
    MAINNET = 'mainnet',
    TESTNET = 'testnet'
}

export const btcNetworkConfig = {
    [BTC_NETWORK.MAINNET]: bitcoin.networks.bitcoin,
    [BTC_NETWORK.TESTNET]: bitcoin.networks.testnet
};
