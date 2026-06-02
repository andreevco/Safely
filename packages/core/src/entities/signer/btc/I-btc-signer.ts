import type { Transaction } from '@scure/btc-signer';

export interface BtcSigningRequest {
    psbt: Transaction;
    utxos: Array<{
        derivationPath: {
            change: number;
            addressIndex: number;
        };
    }>;
}

export interface IBtcSigner {
    sign(tx: BtcSigningRequest): Promise<Buffer>;
}
