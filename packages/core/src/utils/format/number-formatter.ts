import type { BigSource } from 'big.js';
import Big from 'big.js';

import type { Logger } from '@safely/sync';

import type { NumberFormatLocale } from './locale-adapter';
import type { CryptoCurrencyDisplay, FiatCurrencyDisplay } from './types';
import type { CryptoAssetAmount, FiatAssetAmount } from '../../entities';
import { isCryptoAsset } from '../../entities/asset/crypto-asset';
import { isFiatAsset } from '../../entities/asset/fiat-asset';
import { SPACE } from '../string';
import { assertUnreachable } from '../types';

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
    private readonly logger: Logger;

    constructor(
        private readonly locale: NumberFormatLocale,
        logger: Logger
    ) {
        this.logger = logger.child('NumberFormatter');
    }

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
            showPositiveSign?: boolean;
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
            this.logger.error('formatAssetAmount failed', e);
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

        return `${formatted}${SPACE.NNBSP}${options.symbol}`;
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
        const minFractionDigits = this.locale.getCurrencyFractionDigits(opts.currency);
        const formatted = this.formatNumber(bigValue.abs(), {
            fullPrecision: opts.fullPrecision,
            useGrouping: opts.useGrouping,
            minFractionDigits
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

    public formatPercent(value: BigSource): string {
        const bigValue = Big(value);
        const rounded = this.roundToSignificantFractionDigits(bigValue.abs(), 1);
        const formatted = this.formatFullPrecision(rounded);

        const sign = bigValue.lt(0) ? '−' : bigValue.gt(0) ? '+' : '';
        const signPrefix = sign ? `${sign}${SPACE.NNBSP}` : '';

        return `${signPrefix}${formatted}${SPACE.NNBSP}%`;
    }

    private formatNumber(
        value: BigSource,
        options?: { fullPrecision?: boolean; useGrouping?: boolean; minFractionDigits?: number }
    ): string {
        const bigValue = Big(value);
        const useGrouping = options?.useGrouping ?? true;
        const minFractionDigits = options?.minFractionDigits;

        return options?.fullPrecision
            ? this.formatFullPrecision(bigValue, useGrouping, minFractionDigits)
            : this.formatDynamicPrecision(bigValue, useGrouping, minFractionDigits);
    }

    private roundToSignificantFractionDigits(value: Big, digits: number): Big {
        const abs = value.abs();

        if (abs.eq(0)) {
            return value;
        }

        const decimals = abs.gte(1) ? digits : -abs.e + digits - 1;
        return value.round(decimals, Big.roundHalfUp);
    }

    private formatDynamicPrecision(
        value: Big,
        useGrouping = true,
        minFractionDigits?: number
    ): string {
        const truncated = this.truncateForDisplay(value, minFractionDigits);

        return truncated.eq(0)
            ? '0'
            : this.formatFullPrecision(truncated, useGrouping, minFractionDigits);
    }

    private truncateForDisplay(value: Big, fractionDigits?: number): Big {
        const abs = value.abs();
        const decimals = fractionDigits ?? 2;

        if (abs.gte(1000)) {
            return value.round(0, 0);
        } else if (abs.gte(1)) {
            return value.round(decimals, 0);
        } else if (abs.gt(0)) {
            return value.prec(3, 0);
        }

        return Big(0);
    }

    private formatFullPrecision(
        value: Big,
        useGrouping = true,
        minFractionDigits?: number
    ): string {
        const isNegative = value.lt(0);
        const absStr = value.abs().toFixed();
        const [intPart, fracPart = ''] = absStr.split('.');

        const formattedInt = useGrouping ? this.addGroupSeparators(intPart) : intPart;
        const paddedFrac = this.padFraction(fracPart, minFractionDigits);
        const result = paddedFrac
            ? `${formattedInt}${this.locale.decimalSeparator}${paddedFrac}`
            : formattedInt;

        return isNegative ? `-${result}` : result;
    }

    private padFraction(fracPart: string, minFractionDigits?: number): string {
        if (!fracPart || minFractionDigits === undefined || minFractionDigits === 0) {
            return fracPart;
        }

        return fracPart.padEnd(minFractionDigits, '0');
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
