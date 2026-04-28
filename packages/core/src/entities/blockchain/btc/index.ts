import { bitcoin } from '../../../blockchain-api/btc/bitcoinjs';
import { assertUnreachable } from '../../../utils/types';
import { PortfolioNetworkType } from '../../portfolio/portfolio-network-type';

export enum BtcWalletType {
    NATIVE_SEGWIT = 'NATIVE_SEGWIT'
}

export enum BtcNetwork {
    MAINNET = 'mainnet',
    TESTNET = 'testnet'
}

export const btcNetworkConfig = {
    [BtcNetwork.MAINNET]: bitcoin.networks.bitcoin,
    [BtcNetwork.TESTNET]: bitcoin.networks.testnet
};

export function btcNetworkByPortfolioNetworkType(networkType: PortfolioNetworkType): BtcNetwork {
    switch (networkType) {
        case PortfolioNetworkType.MAINNET:
            return BtcNetwork.MAINNET;
        case PortfolioNetworkType.TESTNET:
            return BtcNetwork.TESTNET;
        default:
            assertUnreachable(networkType);
    }
}

export const btcBlockWaitingTimeMinutes = 10;
