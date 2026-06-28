import {
    DefaultDescriptorTemplate,
    DefaultWallet,
    SignerBtcBuilder
} from '@ledgerhq/device-signer-kit-bitcoin';
import type { SignPsbtDAOutput } from '@ledgerhq/device-signer-kit-bitcoin';
import { HDKey } from '@scure/bip32';
import { bip32Path } from '@scure/btc-signer';
import type { Transaction } from '@scure/btc-signer';

import { assertBtcFeeIsNotAbsurd } from './assert-btc-fee';
import type { BtcSigningRequest, IBtcSigner } from './I-btc-signer';
import type { ILedgerSessionPort, LedgerAccountContext } from './I-ledger-session-port';
import { awaitDeviceAction } from '../../../ledger/await-device-action';
import { BtcDerivationPath, BtcWalletType } from '../../blockchain';

export class LedgerBtcSigner implements IBtcSigner {
    constructor(
        private readonly context: LedgerAccountContext,
        private readonly sessionPort: ILedgerSessionPort
    ) {}

    public async sign(request: BtcSigningRequest): Promise<Buffer> {
        const { psbt } = request;

        this.enrichPsbt(request);

        const wallet = this.buildWalletPolicy();

        const signatures = await this.sessionPort.withSession(
            { expectedFingerprint: this.context.masterFingerprint },
            ({ ledgerKit, sessionId, signal }) => {
                const bitcoinApp = new SignerBtcBuilder({ dmk: ledgerKit, sessionId }).build();

                return awaitDeviceAction(bitcoinApp.signPsbt(wallet, psbt.toPSBT()), signal);
            }
        );

        this.applySignatures(psbt, signatures);

        psbt.finalize();

        assertBtcFeeIsNotAbsurd(psbt);

        return Buffer.from(psbt.extract());
    }

    private enrichPsbt({ psbt, utxos }: BtcSigningRequest): void {
        const node = HDKey.fromExtendedKey(this.context.xpub);
        const fingerprint = Buffer.from(this.context.masterFingerprint, 'hex').readUInt32BE(0);
        const derivationPath = new BtcDerivationPath(
            BtcWalletType.NATIVE_SEGWIT,
            this.context.network,
            this.context.accountIndex
        );

        utxos.forEach((utxo, index) => {
            const { change, addressIndex } = utxo.derivationPath;

            psbt.updateInput(index, {
                bip32Derivation: [
                    [
                        this.derivePublicKey(node, change, addressIndex),
                        {
                            fingerprint,
                            path: bip32Path(derivationPath.address(change, addressIndex))
                        }
                    ]
                ]
            });
        });
    }

    private applySignatures(psbt: Transaction, signatures: SignPsbtDAOutput): void {
        signatures.forEach(signature => {
            if (!('signature' in signature)) {
                throw new Error('Unexpected signature type from Ledger');
            }

            psbt.updateInput(signature.inputIndex, {
                partialSig: [[signature.pubkey, signature.signature]]
            });
        });
    }

    private derivePublicKey(node: HDKey, change: number, addressIndex: number): Uint8Array {
        const publicKey = node.deriveChild(change).deriveChild(addressIndex).publicKey;

        if (!publicKey) {
            throw new Error('Failed to derive public key for Ledger input');
        }

        return publicKey;
    }

    private buildWalletPolicy(): DefaultWallet {
        const path = new BtcDerivationPath(
            BtcWalletType.NATIVE_SEGWIT,
            this.context.network,
            this.context.accountIndex
        )
            .account()
            .replace(/^m\//, '');

        return new DefaultWallet(path, DefaultDescriptorTemplate.NATIVE_SEGWIT);
    }
}
