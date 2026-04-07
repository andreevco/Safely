import { z } from 'zod';

import {
    AddressSchema,
    ChainTipSchema,
    EstimatedFeesSchema,
    SendTxResultSchema,
    TxSchema,
    UtxoWithOptionalTxSchema
} from './models';
import { BtcWalletType } from '../../entities/blockchain/btc';
import { ApiClient } from '../../utils/fetch';
import { IIdentifiable } from '../../utils/types';

export { BtcApiError } from './errors';

export interface GetAddressParams {
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txslight' | 'txs';
    pageSize?: number;
    page?: number;
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
        return await this.getJson(`/v1/xpubs/${serialized}`, AddressSchema, params);
    }

    public async getUtxos(descriptor: BtcDescriptor, withPendingTxs = false) {
        const serialized = this.serializeDescriptor(descriptor);
        return await this.getJson(
            `/v1/utxos/${serialized}`,
            z.array(UtxoWithOptionalTxSchema),
            withPendingTxs ? { withPendingTxs: true } : undefined
        );
    }

    public async getTransaction(txid: string) {
        return await this.getJson(`/v1/transactions/${txid}`, TxSchema);
    }

    public async getBlockTipHeight(): Promise<number> {
        const response = await this.getJson(`/v1/chain/tip`, ChainTipSchema);
        return response.height;
    }

    /**
     * float sat/vByte
     */
    public async getFeePrice() {
        return this.getJson('/v1/fees/estimate', EstimatedFeesSchema);
    }

    public async sendTransaction(hex: string): Promise<{ txid: string }> {
        const res = await this.postPlain('/v1/transactions/send', hex, SendTxResultSchema);
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
