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

export function buildLedgerWalletPolicy(accountIndex: number): DefaultWallet {
    return new DefaultWallet(`84'/0'/${accountIndex}'`, DefaultDescriptorTemplate.NATIVE_SEGWIT);
}

export function enrichPsbtForLedger(
    psbt: Transaction,
    utxos: BtcSigningRequest['utxos'],
    context: LedgerAccountContext
): void {
    const node = HDKey.fromExtendedKey(context.xpub);
    const fingerprint = Buffer.from(context.masterFingerprint, 'hex').readUInt32BE(0);

    utxos.forEach((utxo, index) => {
        const { change, addressIndex } = utxo.derivationPath;

        psbt.updateInput(index, {
            bip32Derivation: [
                [
                    derivePublicKey(node, change, addressIndex),
                    {
                        fingerprint,
                        path: bip32Path(
                            `m/84'/0'/${context.accountIndex}'/${change}/${addressIndex}`
                        )
                    }
                ]
            ]
        });
    });
}

export function applyLedgerSignatures(psbt: Transaction, signatures: SignPsbtDAOutput): void {
    signatures.forEach(signature => {
        if (!('signature' in signature)) {
            throw new Error('Unexpected signature type from Ledger');
        }

        psbt.updateInput(signature.inputIndex, {
            partialSig: [[signature.pubkey, signature.signature]]
        });
    });
}

function derivePublicKey(node: HDKey, change: number, addressIndex: number): Uint8Array {
    const publicKey = node.deriveChild(change).deriveChild(addressIndex).publicKey;

    if (!publicKey) {
        throw new Error('Failed to derive public key for Ledger input');
    }

    return publicKey;
}

export class LedgerBtcSigner implements IBtcSigner {
    constructor(
        private readonly context: LedgerAccountContext,
        private readonly sessionPort: ILedgerSessionPort
    ) {}

    public async sign({ psbt, utxos }: BtcSigningRequest): Promise<Buffer> {
        enrichPsbtForLedger(psbt, utxos, this.context);

        const wallet = buildLedgerWalletPolicy(this.context.accountIndex);

        const signatures = await this.sessionPort.withSession(
            { expectedFingerprint: this.context.masterFingerprint },
            ({ ledgerKit, sessionId, signal }) => {
                const bitcoinApp = new SignerBtcBuilder({ dmk: ledgerKit, sessionId }).build();

                return awaitDeviceAction(bitcoinApp.signPsbt(wallet, psbt.toPSBT()), signal);
            }
        );

        applyLedgerSignatures(psbt, signatures);

        psbt.finalize();

        assertBtcFeeIsNotAbsurd(psbt);

        return Buffer.from(psbt.extract());
    }
}
