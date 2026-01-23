import Big from 'big.js';
import { z } from 'zod';

import { AddressSchema, GasPriceSchema, UtxoSchema } from './models';
import { BtcWalletType } from '../../entities/blockchain/btc';
import { ApiClient } from '../../utils/fetch';
import { IIdentifiable } from '../../utils/types';

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

export class BtcApiError extends Error {
    public readonly name = 'BtcApiError';

    public readonly status: number;

    public readonly payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
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

    /**
     * float sat/vByte
     */
    public async getFeePrice() {
        const parsed = await this.getJson('/api/gasprice', GasPriceSchema);
        const keys = Object.keys(parsed)
            .map(Number)
            .filter(isFinite)
            .filter(k => k >= 0);

        if (keys.length === 0) {
            throw new Error('Cannot fetch gasprice');
        }

        const minKey = Math.min(...keys);
        return new Big(parsed[minKey]);
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
