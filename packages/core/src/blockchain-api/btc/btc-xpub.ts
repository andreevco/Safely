import { HDKey } from '@scure/bip32';
import * as bitcoin from 'bitcoinjs-lib';

import { BtcNetwork, btcNetworkConfig } from '../../entities/blockchain';

export class BtcXpub {
    public static validate(input: string): boolean {
        try {
            HDKey.fromExtendedKey(input);
            return true;
        } catch {
            return false;
        }
    }

    public static deriveAddress(xpub: string, network: BtcNetwork): string {
        const hdKey = HDKey.fromExtendedKey(xpub);
        const pubkey = hdKey.deriveChild(0).deriveChild(0).publicKey;

        if (!pubkey) {
            throw new Error('Failed to derive public key from xpub');
        }

        const { address } = bitcoin.payments.p2wpkh({
            pubkey,
            network: btcNetworkConfig[network]
        });

        if (!address) {
            throw new Error('Failed to derive address from xpub');
        }

        return address;
    }
}
