import { z } from 'zod';

import { AddressSchema, GasPricesSchema, TxSchema, UtxoSchema } from './models';
import { BtcWalletType } from '../../entities/blockchain/btc';
import { ApiClient } from '../../utils/fetch';
import { IIdentifiable } from '../../utils/types';

export { BtcApiError } from './errors';

export interface GetAddressParams {
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txslight' | 'txs';
    tokens?: 'derived' | 'used' | 'nonzero';
    pageSize?: number;
    page?: number;
    from?: number;
    to?: number;
    contractFilter?: string;
    secondaryCurrency?: string;
    gap?: number;
}

export interface BtcDescriptor {
    type: BtcWalletType;
    xpub: string;
    derivationPath?: {
        change: number;
        addressIndex: number | '*';
    };
}

const btcWalletTypeToDescriptor: Record<BtcWalletType, 'wpkh' | 'pkh' | 'tr' | 'sh-wpkh'> = {
    [BtcWalletType.NATIVE_SEGWIT]: 'wpkh'
};

export class BtcApi extends ApiClient implements IIdentifiable {
    public readonly id: string;

    constructor(options: { baseUrl: string }) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        super(baseUrl);

        this.id = `${this.constructor.name}:${baseUrl}`;
    }

    public async getXpub(descriptor: BtcDescriptor, params?: GetAddressParams) {
        const serialized = this.serializeDescriptor(descriptor);
        return await this.getJson(`/api/v2/xpub/${serialized}`, AddressSchema, params);
    }

    public async getAccountUtxo(descriptor: BtcDescriptor) {
        const serialized = this.serializeDescriptor(descriptor);
        return await this.getJson(`/api/v2/utxo/${serialized}`, z.array(UtxoSchema));
    }

    public async getTransaction(txid: string) {
        return await this.getJson(`/api/v2/tx/${txid}`, TxSchema);
    }

    /**
     * float sat/vByte
     */
    public async getFeePrice() {
        return this.getJson('/api/gasprice', GasPricesSchema);
    }

    public async sendTransaction(hex: string): Promise<{ txid: string }> {
        const res = await this.postPlain('/api/v2/sendtx/', hex, z.object({ result: z.string() }));
        return { txid: res.result };
    }

    private serializeDescriptor(descriptor: BtcDescriptor): string {
        let path = `${btcWalletTypeToDescriptor[descriptor.type]}(${descriptor.xpub}`;
        if (descriptor.derivationPath) {
            path += `/${descriptor.derivationPath?.change ?? 0}/${descriptor.derivationPath?.addressIndex ?? '*'}`;
        }

        return path + ')';
    }
}
