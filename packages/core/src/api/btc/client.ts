import { z } from 'zod';

import { BtcApiError } from './errors';
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
import { asyncRetry } from '../../utils/retry';
import type { IIdentifiable } from '../../utils/types';

export { BtcApiError } from './errors';

function isTransientSendError(error: unknown): boolean {
    if (error instanceof BtcApiError) {
        return error.status === 408 || error.status === 429 || error.status >= 500;
    }

    return error instanceof TypeError;
}

export interface GetAddressParams {
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txslight' | 'txs';
    pageSize?: number;
    page?: number;
}

export type BtcDescriptor = BtcXpubDescriptor | BtcAddressDescriptor;

export interface BtcXpubDescriptor {
    type: BtcWalletType;
    xpub: string;
}

export interface BtcAddressDescriptor {
    type: BtcWalletType;
    xpub: null;
    address: string;
}

function isAddressDescriptor(descriptor: BtcDescriptor): descriptor is BtcAddressDescriptor {
    return descriptor.xpub === null;
}

const btcWalletTypeToDescriptor: Record<BtcWalletType, 'wpkh' | 'pkh' | 'tr' | 'sh-wpkh'> = {
    [BtcWalletType.NATIVE_SEGWIT]: 'wpkh'
};

export class BtcApi extends ApiClient implements IIdentifiable {
    protected readonly timeoutMs = 10_000;

    protected readonly errorConstructor = BtcApiError;

    public readonly id: string;

    constructor(options: { baseUrl: string }) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        super(baseUrl);

        this.id = `${this.constructor.name}:${baseUrl}`;
    }

    public async getAddressInfo(descriptor: BtcDescriptor, params?: GetAddressParams) {
        const id = this.resolveDescriptorId(descriptor);
        return await this.getJson(`/v1/${id.endpoint}/${id.value}`, AddressSchema, params);
    }

    public async getUtxos(descriptor: BtcDescriptor, withPendingTxs = false) {
        const id = this.resolveDescriptorId(descriptor);
        return await this.getJson(
            `/v1/utxos/${id.value}`,
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

    public readonly sendTransaction = asyncRetry(
        async (hex: string): Promise<{ txid: string }> => {
            const res = await this.postPlain('/v1/transactions/send', hex, SendTxResultSchema);
            return { txid: res.result };
        },
        { maxAttempts: 3, backoff: 'fixed', baseWait: 1000, shouldRetry: isTransientSendError }
    );

    private resolveDescriptorId(descriptor: BtcDescriptor): { endpoint: string; value: string } {
        if (isAddressDescriptor(descriptor)) {
            return { endpoint: 'addresses', value: descriptor.address };
        }

        return {
            endpoint: 'xpubs',
            value: `${btcWalletTypeToDescriptor[descriptor.type]}(${descriptor.xpub})`
        };
    }
}
