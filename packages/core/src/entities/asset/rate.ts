import Big from 'big.js';
import * as z from 'zod';

import { CryptoAsset, sCryptoAsset } from './crypto-asset';
import { FiatAsset, sFiatAsset } from './fiat-asset';
import { IAsset } from './I-asset';

interface IRate<Base extends IAsset, Quote extends IAsset> {
    /**
     * The base asset — the one being valued.
     * @example Example: BTC in the pair BTC/USD.
     */
    base: Base;

    /**
     * The quote asset — the currency or token in which the base asset is priced.
     * @example: USD in the pair BTC/USD.
     */
    quote: Quote;

    /**
     * The price of one unit of `base` expressed in `quote`.
     * @example: 1 BTC = 50000 USD → value = 50000
     */
    value: Big;

    diff7d?: string;

    diff24h?: string;

    diff30d?: string;
}

export class Rate<Base extends IAsset, Quote extends IAsset> implements IRate<Base, Quote> {
    constructor(
        public readonly base: Base,
        public quote: Quote,
        public readonly value: Big,
        public readonly diff7d?: string,
        public readonly diff24h?: string,
        public readonly diff30d?: string
    ) {}
}

export type CryptoFiatRate = Rate<CryptoAsset, FiatAsset>;
export const sCryptoFiatRate = z
    .object({
        base: sCryptoAsset,
        quote: sFiatAsset,
        diff7d: z.string().optional(),
        diff24h: z.string().optional(),
        diff30d: z.string().optional(),
        value: z.string()
    })
    .nullable()
    .transform(val => {
        if (val === null) {
            return val;
        }

        return new Rate(val.base, val.quote, Big(val.value), val.diff7d, val.diff24h, val.diff30d);
    });
