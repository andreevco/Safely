import { Psbt } from '../../../blockchain-api/btc/bitcoinjs';

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
