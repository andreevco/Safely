import { z } from 'zod';

import { AddressSchema, BlockHeightScheme, GasPricesSchema, TxSchema, UtxoSchema } from './models';
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

export type BtcDescriptor = BtcXpubDescriptor | BtcAddressDescriptor;

export interface BtcXpubDescriptor {
    type: BtcWalletType;
    xpub: string;
    derivationPath?: {
        change: number;
        addressIndex: number | '*';
    };
}

export interface BtcAddressDescriptor {
    type: BtcWalletType;
    xpub: '';
    address: string;
}

function isAddressDescriptor(descriptor: BtcDescriptor): descriptor is BtcAddressDescriptor {
    return !descriptor.xpub;
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

    public async getAddressInfo(descriptor: BtcDescriptor, params?: GetAddressParams) {
        const id = this.resolveDescriptorId(descriptor);
        return await this.getJson(`/api/v2/${id.endpoint}/${id.value}`, AddressSchema, params);
    }

    public async getAccountUtxo(descriptor: BtcDescriptor) {
        const id = this.resolveDescriptorId(descriptor);
        return await this.getJson(`/api/v2/utxo/${id.value}`, z.array(UtxoSchema));
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

    private resolveDescriptorId(descriptor: BtcDescriptor): { endpoint: string; value: string } {
        if (isAddressDescriptor(descriptor)) {
            return { endpoint: 'address', value: descriptor.address };
        }

        let path = `${btcWalletTypeToDescriptor[descriptor.type]}(${descriptor.xpub}`;
        if (descriptor.derivationPath) {
            path += `/${descriptor.derivationPath.change ?? 0}/${descriptor.derivationPath.addressIndex ?? '*'}`;
        }

        return { endpoint: 'xpub', value: path + ')' };
    }
}
