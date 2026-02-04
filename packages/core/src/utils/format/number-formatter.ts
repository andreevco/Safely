import Big, { BigSource } from 'big.js';

import type { CryptoAssetAmount, FiatAssetAmount } from '../../entities';
import { isCryptoAsset, isFiatAsset } from '../../entities';
import { assertUnreachable } from '../types';
import { NumberFormatLocale } from './locale-adapter';
import { CryptoCurrencyDisplay, FiatCurrencyDisplay } from './types';

interface FormatCryptoOptions {
    fullPrecision?: boolean;
    currencyDisplay?: CryptoCurrencyDisplay;
    useGrouping?: boolean;
    symbol: string;
}

interface FormatCryptoOptionsNoSymbol {
    fullPrecision?: boolean;
    currencyDisplay: 'none';
    useGrouping?: boolean;
}

interface FormatFiatOptions {
    fullPrecision?: boolean;
    currencyDisplay?: FiatCurrencyDisplay;
    showPositiveSign?: boolean;
    useGrouping?: boolean;
    currency: string;
}

interface FormatFiatOptionsNoSymbol {
    fullPrecision?: boolean;
    currencyDisplay: 'none';
    showPositiveSign?: boolean;
    useGrouping?: boolean;
}

export class NumberFormatter {
    constructor(private readonly locale: NumberFormatLocale) {}

    public parseInput(value: string, decimalPlaces: number): { parsed: Big; formatted: string } {
        const trimmed = value.trim();

        if (!this.isValidNumberInput(trimmed)) {
            throw new Error('Invalid number input');
        }

        let normalized = trimmed
            .split(this.locale.groupSeparator)
            .join('')
            .split(this.locale.decimalSeparator)
            .join('.');

        if (normalized === '.') {
            normalized = '0.';
        }

        const decimalRegex = /^\d*(.\d*)?$/;
        if (!decimalRegex.test(normalized)) {
            throw new Error('Invalid number format');
        }

        const parsed = Big(normalized || '0').round(decimalPlaces, 0);
        const [intPart, fracPart = ''] = normalized.split('.');

        let formatted = intPart;
        if (fracPart || normalized.endsWith('.')) {
            formatted += this.locale.decimalSeparator + fracPart.slice(0, decimalPlaces);
        }

        return { parsed, formatted };
    }

    public formatAssetAmount(
        value: CryptoAssetAmount,
        options?: {
            fullPrecision?: boolean;
            currencyDisplay?: CryptoCurrencyDisplay;
            useGrouping?: boolean;
        }
    ): string;
    public formatAssetAmount(
        value: FiatAssetAmount,
        options?: {
            fullPrecision?: boolean;
            showPositiveSign?: boolean;
            currencyDisplay?: FiatCurrencyDisplay;
            useGrouping?: boolean;
        }
    ): string;
    public formatAssetAmount(
        value: FiatAssetAmount | CryptoAssetAmount,
        options?: {
            fullPrecision?: boolean;
            showPositiveSign?: boolean;
            currencyDisplay?: FiatCurrencyDisplay | CryptoCurrencyDisplay;
            useGrouping?: boolean;
        }
    ): string {
        try {
            if (isFiatAsset(value.asset)) {
                const fiatAmount = value as FiatAssetAmount;
                return this.formatFiat(fiatAmount.amount, {
                    currencyDisplay: options?.currencyDisplay as FiatCurrencyDisplay,
                    fullPrecision: options?.fullPrecision,
                    showPositiveSign: options?.showPositiveSign,
                    useGrouping: options?.useGrouping,
                    currency: fiatAmount.asset.id.symbol
                });
            } else if (isCryptoAsset(value.asset)) {
                const cryptoAmount = value as CryptoAssetAmount;
                return this.formatCrypto(cryptoAmount.relativeAmount, {
                    currencyDisplay: options?.currencyDisplay as CryptoCurrencyDisplay,
                    fullPrecision: options?.fullPrecision,
                    useGrouping: options?.useGrouping,
                    symbol: cryptoAmount.asset.symbol
                });
            } else {
                assertUnreachable(value.asset);
            }
        } catch (e) {
            console.error(e);
            return '-';
        }
    }

    public formatCrypto(value: BigSource, options: FormatCryptoOptions): string;
    public formatCrypto(value: BigSource, options: FormatCryptoOptionsNoSymbol): string;
    public formatCrypto(
        value: BigSource,
        options: FormatCryptoOptions | FormatCryptoOptionsNoSymbol
    ): string {
        const formatted = this.formatNumber(value, {
            fullPrecision: options.fullPrecision,
            useGrouping: options.useGrouping
        });

        if (options.currencyDisplay === 'none') {
            return formatted;
        }

        return `${formatted} ${options.symbol}`;
    }

    public formatFiat(value: BigSource, options: FormatFiatOptions): string;
    public formatFiat(value: BigSource, options: FormatFiatOptionsNoSymbol): string;
    public formatFiat(
        value: BigSource,
        options: FormatFiatOptions | FormatFiatOptionsNoSymbol
    ): string {
        if (options.currencyDisplay === 'none') {
            return this.formatNumber(value, {
                fullPrecision: options.fullPrecision,
                useGrouping: options.useGrouping
            });
        }

        const opts = options;
        const bigValue = Big(value);
        const formatted = this.formatNumber(bigValue.abs(), {
            fullPrecision: opts.fullPrecision,
            useGrouping: opts.useGrouping
        });

        const display = opts.currencyDisplay ?? 'symbol';
        const affixes = this.locale.getCurrencyAffixes(
            opts.currency,
            display === 'none' ? 'symbol' : display
        );

        const { prefix, suffix } = bigValue.lt(0) ? affixes.negative : affixes.positive;

        if (bigValue.eq(0)) {
            return `${prefix}${formatted}${suffix}`;
        }

        const sign = bigValue.lt(0) ? '-' : opts.showPositiveSign ? '+' : '';
        return `${sign}${prefix}${formatted}${suffix}`;
    }

    private formatNumber(
        value: BigSource,
        options?: { fullPrecision?: boolean; useGrouping?: boolean }
    ): string {
        const bigValue = Big(value);
        const useGrouping = options?.useGrouping ?? true;

        return options?.fullPrecision
            ? this.formatFullPrecision(bigValue, useGrouping)
            : this.formatDynamicPrecision(bigValue, useGrouping);
    }

    private formatDynamicPrecision(value: Big, useGrouping = true): string {
        const truncated = this.truncateForDisplay(value);
        return truncated.eq(0) ? '0' : this.formatFullPrecision(truncated, useGrouping);
    }

    private truncateForDisplay(value: Big): Big {
        const abs = value.abs();

        if (abs.gte(1000)) {
            return value.round(0, 0);
        } else if (abs.gte(1)) {
            return value.round(2, 0);
        } else if (abs.gt(0)) {
            return value.prec(3, 0);
        }

        return Big(0);
    }

    private formatFullPrecision(value: Big, useGrouping = true): string {
        const isNegative = value.lt(0);
        const absStr = value.abs().toFixed();
        const [intPart, fracPart = ''] = absStr.split('.');

        const formattedInt = useGrouping ? this.addGroupSeparators(intPart) : intPart;
        const result = fracPart
            ? `${formattedInt}${this.locale.decimalSeparator}${fracPart}`
            : formattedInt;

        return isNegative ? `-${result}` : result;
    }

    private addGroupSeparators(integerPart: string): string {
        if (this.locale.groupSeparator === '' || this.locale.primaryGroupSize <= 0) {
            return integerPart;
        }

        const chunks: string[] = [];
        let remaining = integerPart.length;
        const primary = this.locale.primaryGroupSize;
        const secondary = this.locale.secondaryGroupSize || primary;

        const firstLen = Math.min(primary, remaining);
        if (firstLen > 0) {
            chunks.unshift(integerPart.slice(remaining - firstLen, remaining));
            remaining -= firstLen;
        }

        while (remaining > 0) {
            const len = Math.min(secondary, remaining);
            chunks.unshift(integerPart.slice(remaining - len, remaining));
            remaining -= len;
        }

        return chunks.join(this.locale.groupSeparator);
    }

    private isValidNumberInput(input: string): boolean {
        if (input === '') return true;

        const decimal = this.locale.decimalSeparator;
        const group = this.locale.groupSeparator;
        const escape = (ch: string) => `\\${ch}`;

        const allowedChars = new RegExp(`^[0-9${escape(group)}${escape(decimal)}]*$`);
        if (!allowedChars.test(input)) return false;

        if (group && group === decimal) {
            const s = escape(group);
            return new RegExp(`^(?!^${s})(?!.*${s}{2,})[0-9${escape(group)}]*$`).test(input);
        }

        const d = escape(decimal);
        const rules: string[] = [`(?!.*${d}.*${d})`];

        if (group) {
            const g = escape(group);
            rules.push(
                `(?!^${g})`,
                `(?!.*${g}{2,})`,
                `(?!.*${g}${d})`,
                `(?!.*${d}${g})`,
                `(?!.*${d}.*${g})`
            );
        }

        return new RegExp(`^${rules.join('')}[0-9${escape(group)}${escape(decimal)}]*$`).test(
            input
        );
    }
}
