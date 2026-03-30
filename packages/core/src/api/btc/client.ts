import { z } from 'zod';

import {
    AddressSchema,
    BlockHeightScheme,
    GasPricesSchema,
    TxSchema,
    UtxoSchema,
    UtxoWithTxSchema
} from './models';
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

    public async getAccountConfirmedUtxo(descriptor: BtcDescriptor) {
        const serialized = this.serializeDescriptor(descriptor);
        return await this.getJson(`/api/v2/utxo/${serialized}?confirmed=true`, z.array(UtxoSchema));
    }

    public async getAccountUnconfirmedUtxo(descriptor: BtcDescriptor) {
        return this.getJson(
            `/extensions/v1/utxo/${this.serializeDescriptor(descriptor)}/unconfirmed?withTxs=true`,
            z.array(UtxoWithTxSchema)
        );
    }

    public async getTransaction(txid: string) {
        return await this.getJson(`/api/v2/tx/${txid}`, TxSchema);
    }

    public async getBlockTipHeight(): Promise<number> {
        const response = await this.getJson(`/extensions/v1/blocks/tip/height`, BlockHeightScheme);
        return response.height;
    }

    /**
     * float sat/vByte
     */
    public async getFeePrice() {
        return this.getJson('/extensions/v1/fees/estimate', GasPricesSchema);
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
