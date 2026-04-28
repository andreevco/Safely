import { HDKey, Versions } from '@scure/bip32';

import * as bitcoin from './bitcoinjs';
import { BtcNetwork, btcNetworkConfig, BtcWalletType } from '../../entities';
import { assertUnreachable } from '../../utils';

const EXTENDED_KEY_VERSIONS: Record<string, Versions> = {
    xpub: { private: 0x0488ade4, public: 0x0488b21e },
    ypub: { private: 0x049d7878, public: 0x049d7cb2 },
    zpub: { private: 0x04b2430c, public: 0x04b24746 },
    tpub: { private: 0x04358394, public: 0x043587cf },
    upub: { private: 0x044a4e28, public: 0x044a5262 },
    vpub: { private: 0x045f18bc, public: 0x045f1cf6 }
};

function parseExtendedKey(input: string): HDKey {
    const versions = EXTENDED_KEY_VERSIONS[input.slice(0, 4)];
    if (!versions) {
        throw new Error('Unsupported extended key prefix');
    }
    return HDKey.fromExtendedKey(input, versions);
}

export class BtcXpub {
    public static validate(input: string): boolean {
        try {
            parseExtendedKey(input);
            return true;
        } catch {
            return false;
        }
    }

    public static toZpub(input: string): string {
        const hd = parseExtendedKey(input);
        if (!hd.publicKey || !hd.chainCode) {
            throw new Error('Cannot convert extended private key to zpub');
        }
        const reencoded = new HDKey({
            versions: EXTENDED_KEY_VERSIONS.zpub,
            depth: hd.depth,
            parentFingerprint: hd.parentFingerprint,
            index: hd.index,
            chainCode: hd.chainCode,
            publicKey: hd.publicKey
        });
        return reencoded.publicExtendedKey;
    }

    public static deriveAddress(
        xpub: string,
        network: BtcNetwork,
        walletType: BtcWalletType
    ): string {
        const hdKey = parseExtendedKey(xpub);
        const pubkey = hdKey.deriveChild(0).deriveChild(0).publicKey;

        if (!pubkey) {
            throw new Error('Failed to derive public key from xpub');
        }

        switch (walletType) {
            case BtcWalletType.NATIVE_SEGWIT: {
                const { address } = bitcoin.payments.p2wpkh({
                    pubkey,
                    network: btcNetworkConfig[network]
                });

                if (!address) {
                    throw new Error('Failed to derive address from xpub');
                }

                return address;
            }
            default:
                assertUnreachable(walletType);
        }
    }
}
