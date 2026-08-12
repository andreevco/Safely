import { Address, NETWORK } from '@scure/btc-signer';
import type { BTC_NETWORK } from '@scure/btc-signer/utils.js';

import { BtcNetwork, btcNetworkConfig } from '../../entities/blockchain/btc';

export type BitcoinAddressType = 'P2PKH' | 'P2SH' | 'P2WPKH' | 'P2WSH' | 'P2TR';

export class BtcAddress {
    public static validForNetwork(address: string): BtcNetwork | null {
        const isValidForMainnet = this.validate(address, btcNetworkConfig[BtcNetwork.MAINNET]);
        if (isValidForMainnet) {
            return BtcNetwork.MAINNET;
        }

        const isValidForTestnet = this.validate(address, btcNetworkConfig[BtcNetwork.TESTNET]);
        if (isValidForTestnet) {
            return BtcNetwork.TESTNET;
        }

        return null;
    }

    public static validate(address: string, network: BTC_NETWORK = NETWORK): boolean {
        try {
            return !!Address(network).decode(address);
        } catch {
            return false;
        }
    }

    public static type(address: string): BitcoinAddressType {
        if (address.startsWith('1')) return 'P2PKH';
        if (address.startsWith('3')) return 'P2SH';
        if (address.startsWith('bc1q') || address.startsWith('tb1q')) return 'P2WPKH';
        if (address.startsWith('bc1p') || address.startsWith('tb1p')) return 'P2TR';
        if ((address.startsWith('bc1') || address.startsWith('tb1')) && address.length === 62) {
            return 'P2WSH';
        }
        if (address.startsWith('bc1') || address.startsWith('tb1')) return 'P2WPKH';
        throw new Error(`Unknown address type: ${address}`);
    }

    public static isSegWit(address: string): boolean {
        const type = this.type(address);
        return type === 'P2WPKH' || type === 'P2WSH' || type === 'P2TR';
    }

    public static isLegacy(address: string): boolean {
        const type = this.type(address);
        return type === 'P2PKH' || type === 'P2SH';
    }
}
