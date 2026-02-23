import { Psbt } from 'bitcoinjs-lib';

export interface BtcSigningRequest {
    psbt: Psbt;
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
