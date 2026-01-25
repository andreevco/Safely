export type FiatCurrencyDisplay = 'symbol' | 'narrowSymbol' | 'code' | 'name' | 'none';
export type CryptoCurrencyDisplay = 'symbol' | 'none';

export interface CurrencyAffixes {
    prefix: string;
    suffix: string;
}

export interface SignedCurrencyAffixes {
    positive: CurrencyAffixes;
    negative: CurrencyAffixes;
}
