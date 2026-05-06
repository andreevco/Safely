import { describe, expect, it } from 'vitest';

import { Logger } from '@safely/sync';

import { SPACE, NumberFormatter, WebNumberFormatLocale } from '../src';

const testLogger = new Logger();

describe('NumberFormatter', () => {
    it('formats fiat in en-US locale with symbol (boundary values)', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'USD' })).toBe('$0');
        expect(formatter.formatFiat(0.01, { currency: 'USD' })).toBe('$0.01');
        expect(formatter.formatFiat(0.999, { currency: 'USD' })).toBe('$0.999');
        expect(formatter.formatFiat(1, { currency: 'USD' })).toBe('$1');
        expect(formatter.formatFiat(1.001, { currency: 'USD' })).toBe('$1');
        expect(formatter.formatFiat(1.004, { currency: 'USD' })).toBe('$1');
        expect(formatter.formatFiat(1.005, { currency: 'USD' })).toBe('$1');
        expect(formatter.formatFiat(1.045, { currency: 'USD' })).toBe('$1.04');
        expect(formatter.formatFiat(1.901, { currency: 'USD' })).toBe('$1.90');
        expect(formatter.formatFiat(-0.01, { currency: 'USD' })).toBe('-$0.01');
        expect(formatter.formatFiat(1000000, { currency: 'USD' })).toBe('$1,000,000');
        expect(formatter.formatFiat(1000000.99, { currency: 'USD' })).toBe('$1,000,000');
        expect(formatter.formatFiat(Number.MAX_SAFE_INTEGER, { currency: 'USD' })).toBe(
            '$9,007,199,254,740,991'
        );
    });

    it('formats fiat in de-DE locale with code', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('de-DE'), testLogger);
        expect(formatter.formatFiat(1.8051, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `1,80${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(0.01, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `0,01${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(0.909, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `0,909${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(1.051, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `1,05${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(1000000, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `1.000.000${SPACE.NNBSP}EUR`
        );
    });

    it('formats fiat with display "none"', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatFiat(1000, { currencyDisplay: 'none' })).toBe('1,000');
        expect(formatter.formatFiat(1.001, { currencyDisplay: 'none' })).toBe('1');
        expect(formatter.formatFiat(1, { currencyDisplay: 'none' })).toBe('1');
        expect(formatter.formatFiat(-0.022, { currencyDisplay: 'none' })).toBe('-0.022');
        expect(formatter.formatFiat(24002.9999, { currencyDisplay: 'none' })).toBe('24,002');
    });

    it('formats crypto above 1000 with grouping', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatCrypto(123456.789, { symbol: 'BTC' })).toBe(
            `123,456${SPACE.NNBSP}BTC`
        );
        expect(formatter.formatCrypto(1000, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1000.08, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1000.0001, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1000.049, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1000.051, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(57004.9999, { symbol: 'BTC' })).toBe(
            `57,004${SPACE.NNBSP}BTC`
        );
        expect(formatter.formatCrypto(999.99, { symbol: 'BTC' })).toBe(`999.99${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(57004.9999, { symbol: 'BTC' })).toBe(
            `57,004${SPACE.NNBSP}BTC`
        );
        expect(formatter.formatCrypto(57004.99999, { symbol: 'BTC' })).toBe(
            `57,004${SPACE.NNBSP}BTC`
        );
    });

    it('formats crypto between 1 and 1000 with 2 decimals', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatCrypto(123.456, { symbol: 'BTC' })).toBe(`123.45${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(999.999, { symbol: 'BTC' })).toBe(`999.99${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1.004, { symbol: 'BTC' })).toBe(`1${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1.005, { symbol: 'BTC' })).toBe(`1${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(99.994, { symbol: 'BTC' })).toBe(`99.99${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(99.995, { symbol: 'BTC' })).toBe(`99.99${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(876.8899, { symbol: 'BTC' })).toBe(`876.88${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1000, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        expect(formatter.formatCrypto(1000.01, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
    });

    it('formats small crypto with significant digits', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatCrypto(0.000123456, { symbol: 'DOGE' })).toBe(
            `0.000123${SPACE.NNBSP}DOGE`
        );
    });

    it('formats zero with fullPrecision', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatCrypto(0, { symbol: 'USDT', fullPrecision: true })).toBe(
            `0${SPACE.NNBSP}USDT`
        );
    });

    it('formats with full precision (no truncation)', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatCrypto(0.000143945, { symbol: 'BTC', fullPrecision: true })).toBe(
            `0.000143945${SPACE.NNBSP}BTC`
        );
        expect(formatter.formatCrypto(123456.789, { symbol: 'BTC' })).toBe(
            `123,456${SPACE.NNBSP}BTC`
        );
        expect(
            formatter.formatCrypto(0.000000123456789, { symbol: 'USDT', fullPrecision: true })
        ).toBe(`0.000000123456789${SPACE.NNBSP}USDT`);
    });

    it('formats negative fiat correctly', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatFiat(-99.99, { currency: 'USD' })).toBe('-$99.99');
        expect(
            formatter.formatFiat(-99.99, {
                currency: 'USD',
                currencyDisplay: 'code',
                fullPrecision: true
            })
        ).toBe(`-99.99${SPACE.NNBSP}USD`);
    });

    it('formats negative crypto correctly', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatCrypto(-0.000456, { currencyDisplay: 'none' })).toBe('-0.000456');
        expect(formatter.formatCrypto(-0.000456, { symbol: 'BTC' })).toBe(
            `-0.000456${SPACE.NNBSP}BTC`
        );
    });

    it('throws for non-finite values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(() => formatter.formatFiat(Infinity, { currency: 'USD' })).toThrow();
        expect(() => formatter.formatFiat(NaN, { currency: 'USD' })).toThrow();
    });

    it('parses input correctly', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        {
            const { parsed, formatted } = formatter.parseInput('.', 9);
            expect(parsed.eq(0)).toBeTruthy();
            expect(formatted).toBe('0.');
        }

        {
            const { parsed, formatted } = formatter.parseInput('   1123.0123456 ', 9);
            expect(parsed.eq('1123.0123456')).toBeTruthy();
            expect(formatted).toBe('1123.0123456');
        }

        {
            const { parsed, formatted } = formatter.parseInput('0.00', 9);
            expect(parsed.eq(0)).toBeTruthy();
            expect(formatted).toBe('0.00');
        }

        expect(() => formatter.parseInput('   1123 .0123456 ', 9)).toThrow();
        expect(() => formatter.parseInput('1123.0123456aaaa', 9)).toThrow();
        expect(() => formatter.parseInput('1123e+5', 9)).toThrow();
        expect(() => formatter.parseInput('0x123a', 9)).toThrow();
    });

    it('formats fiat in fr-FR locale with decimals', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('fr-FR'), testLogger);
        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'EUR' })).toBe(
            `0${SPACE.NNBSP}€`
        );
        expect(formatter.formatFiat(0.1, { currency: 'EUR' })).toBe(`0,10${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(0.12, { currency: 'EUR' })).toBe(`0,12${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(0.123, { currency: 'EUR' })).toBe(`0,123${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(0.00100099, { currency: 'EUR' })).toBe(`0,001${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(0.000000999723, { currency: 'EUR' })).toBe(
            `0,000000999${SPACE.NNBSP}€`
        );
        expect(formatter.formatFiat(1.2345, { currency: 'EUR' })).toBe(`1,23${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(1.9999, { currency: 'EUR' })).toBe(`1,99${SPACE.NNBSP}€`);
    });

    it('formats fiat in ru-RU locale with decimals', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('ru-RU'), testLogger);

        expect(formatter.formatFiat(0.2, { currency: 'RUB' })).toBe(`0,20${SPACE.NNBSP}₽`);
        expect(formatter.formatFiat(0.02, { currency: 'RUB' })).toBe(`0,02${SPACE.NNBSP}₽`);
        expect(formatter.formatFiat(0.0002, { currency: 'RUB' })).toBe(`0,0002${SPACE.NNBSP}₽`);
        expect(formatter.formatFiat(7.00002, { currency: 'RUB' })).toBe(`7${SPACE.NNBSP}₽`);
        expect(formatter.formatFiat(1.5809, { currency: 'RUB' })).toBe(`1,58${SPACE.NNBSP}₽`);
        expect(formatter.formatFiat(9999.567, { currency: 'RUB' })).toBe(
            `9${SPACE.NNBSP}999${SPACE.NNBSP}₽`
        );
        expect(formatter.formatFiat(1000000.999, { currency: 'RUB' })).toBe(
            `1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}₽`
        );
    });

    it('formats fiat in es-ES locale with decimals', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('es-ES'), testLogger);

        expect(formatter.formatFiat(0.1, { currency: 'EUR' })).toBe(`0,10${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(0.555, { currency: 'EUR' })).toBe(`0,555${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(1.556, { currency: 'EUR' })).toBe(`1,55${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(98.067, { currency: 'EUR' })).toBe(`98,06${SPACE.NNBSP}€`);
        expect(formatter.formatFiat(1000000.999, { currency: 'EUR' })).toBe(
            `1.000.000${SPACE.NNBSP}€`
        );
        expect(formatter.formatFiat(0.1, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `0,10${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(0.123, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `0,123${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(7.758, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `7,75${SPACE.NNBSP}EUR`
        );
        expect(formatter.formatFiat(10234.567, { currency: 'EUR', currencyDisplay: 'code' })).toBe(
            `10.234${SPACE.NNBSP}EUR`
        );
        expect(
            formatter.formatFiat(1000000.999, { currency: 'EUR', currencyDisplay: 'code' })
        ).toBe(`1.000.000${SPACE.NNBSP}EUR`);
    });

    it('formats KZT in kk-KZ locale with boundary values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('kk-KZ'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'KZT' })).toBe(
            `0${SPACE.NNBSP}₸`
        );
        expect(formatter.formatFiat(0.01, { currency: 'KZT' })).toBe(`0,01${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(0.999, { currency: 'KZT' })).toBe(`0,999${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1, { currency: 'KZT' })).toBe(`1${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1.001, { currency: 'KZT' })).toBe(`1${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1.004, { currency: 'KZT' })).toBe(`1${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1.005, { currency: 'KZT' })).toBe(`1${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1.045, { currency: 'KZT' })).toBe(`1,04${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1.901, { currency: 'KZT' })).toBe(`1,90${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(-0.01, { currency: 'KZT' })).toBe(`-0,01${SPACE.NNBSP}₸`);
        expect(formatter.formatFiat(1000000, { currency: 'KZT' })).toBe(
            `1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}₸`
        );
        expect(formatter.formatFiat(1000000.99, { currency: 'KZT' })).toBe(
            `1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}₸`
        );
        expect(formatter.formatFiat(5432.123, { currency: 'KZT', currencyDisplay: 'code' })).toBe(
            `5${SPACE.NNBSP}432${SPACE.NNBSP}KZT`
        );
    });

    it('formats UAH in uk-UA locale with boundary values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('uk-UA'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'UAH' })).toBe(
            `0${SPACE.NNBSP}₴`
        );
        expect(formatter.formatFiat(0.01, { currency: 'UAH' })).toBe(`0,01${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(0.999, { currency: 'UAH' })).toBe(`0,999${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1, { currency: 'UAH' })).toBe(`1${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1.001, { currency: 'UAH' })).toBe(`1${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1.004, { currency: 'UAH' })).toBe(`1${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1.005, { currency: 'UAH' })).toBe(`1${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1.045, { currency: 'UAH' })).toBe(`1,04${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1.901, { currency: 'UAH' })).toBe(`1,90${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(-0.01, { currency: 'UAH' })).toBe(`-0,01${SPACE.NNBSP}₴`);
        expect(formatter.formatFiat(1000000, { currency: 'UAH' })).toBe(
            `1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}₴`
        );
        expect(formatter.formatFiat(1000000.99, { currency: 'UAH' })).toBe(
            `1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}₴`
        );
        expect(formatter.formatFiat(9876.543, { currency: 'UAH', currencyDisplay: 'code' })).toBe(
            `9${SPACE.NNBSP}876${SPACE.NNBSP}UAH`
        );
    });

    it('formats GBP in en-GB locale with boundary values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-GB'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'GBP' })).toBe('£0');
        expect(formatter.formatFiat(0.01, { currency: 'GBP' })).toBe('£0.01');
        expect(formatter.formatFiat(0.999, { currency: 'GBP' })).toBe('£0.999');
        expect(formatter.formatFiat(1, { currency: 'GBP' })).toBe('£1');
        expect(formatter.formatFiat(1.001, { currency: 'GBP' })).toBe('£1');
        expect(formatter.formatFiat(1.004, { currency: 'GBP' })).toBe('£1');
        expect(formatter.formatFiat(1.005, { currency: 'GBP' })).toBe('£1');
        expect(formatter.formatFiat(1.045, { currency: 'GBP' })).toBe('£1.04');
        expect(formatter.formatFiat(1.901, { currency: 'GBP' })).toBe('£1.90');
        expect(formatter.formatFiat(-0.01, { currency: 'GBP' })).toBe('-£0.01');
        expect(formatter.formatFiat(1000000, { currency: 'GBP' })).toBe('£1,000,000');
        expect(formatter.formatFiat(1000000.99, { currency: 'GBP' })).toBe('£1,000,000');
        expect(formatter.formatFiat(2345.678, { currency: 'GBP', currencyDisplay: 'code' })).toBe(
            `2,345${SPACE.NNBSP}GBP`
        );
    });

    it('formats CNY in zh-CN locale with boundary values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('zh-CN'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'CNY' })).toBe('¥0');
        expect(formatter.formatFiat(0.01, { currency: 'CNY' })).toBe('¥0.01');
        expect(formatter.formatFiat(0.999, { currency: 'CNY' })).toBe('¥0.999');
        expect(formatter.formatFiat(1, { currency: 'CNY' })).toBe('¥1');
        expect(formatter.formatFiat(1.001, { currency: 'CNY' })).toBe('¥1');
        expect(formatter.formatFiat(1.004, { currency: 'CNY' })).toBe('¥1');
        expect(formatter.formatFiat(1.005, { currency: 'CNY' })).toBe('¥1');
        expect(formatter.formatFiat(1.045, { currency: 'CNY' })).toBe('¥1.04');
        expect(formatter.formatFiat(1.901, { currency: 'CNY' })).toBe('¥1.90');
        expect(formatter.formatFiat(-0.01, { currency: 'CNY' })).toBe('-¥0.01');
        expect(formatter.formatFiat(1000000, { currency: 'CNY' })).toBe('¥1,000,000');
        expect(formatter.formatFiat(1000000.99, { currency: 'CNY' })).toBe('¥1,000,000');
        expect(formatter.formatFiat(3456.789, { currency: 'CNY', currencyDisplay: 'code' })).toBe(
            `3,456${SPACE.NNBSP}CNY`
        );
    });

    it('formats INR in hi-IN locale with boundary values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('hi-IN'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'INR' })).toBe('₹0');
        expect(formatter.formatFiat(0.01, { currency: 'INR' })).toBe('₹0.01');
        expect(formatter.formatFiat(0.999, { currency: 'INR' })).toBe('₹0.999');
        expect(formatter.formatFiat(1, { currency: 'INR' })).toBe('₹1');
        expect(formatter.formatFiat(1.001, { currency: 'INR' })).toBe('₹1');
        expect(formatter.formatFiat(1.004, { currency: 'INR' })).toBe('₹1');
        expect(formatter.formatFiat(1.005, { currency: 'INR' })).toBe('₹1');
        expect(formatter.formatFiat(1.045, { currency: 'INR' })).toBe('₹1.04');
        expect(formatter.formatFiat(1.901, { currency: 'INR' })).toBe('₹1.90');
        expect(formatter.formatFiat(-0.01, { currency: 'INR' })).toBe('-₹0.01');
        expect(formatter.formatFiat(1000000, { currency: 'INR' })).toBe('₹10,00,000');
        expect(formatter.formatFiat(1000000.99, { currency: 'INR' })).toBe('₹10,00,000');
        expect(formatter.formatFiat(4567.89, { currency: 'INR', currencyDisplay: 'code' })).toBe(
            `4,567${SPACE.NNBSP}INR`
        );
    });

    it('formats TRY in tr-TR locale with boundary values', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('tr-TR'), testLogger);

        expect(formatter.formatFiat(0, { currencyDisplay: 'symbol', currency: 'TRY' })).toBe('₺0');
        expect(formatter.formatFiat(0.01, { currency: 'TRY' })).toBe('₺0,01');
        expect(formatter.formatFiat(0.999, { currency: 'TRY' })).toBe('₺0,999');
        expect(formatter.formatFiat(1, { currency: 'TRY' })).toBe('₺1');
        expect(formatter.formatFiat(1.001, { currency: 'TRY' })).toBe('₺1');
        expect(formatter.formatFiat(1.004, { currency: 'TRY' })).toBe('₺1');
        expect(formatter.formatFiat(1.005, { currency: 'TRY' })).toBe('₺1');
        expect(formatter.formatFiat(1.045, { currency: 'TRY' })).toBe('₺1,04');
        expect(formatter.formatFiat(1.901, { currency: 'TRY' })).toBe('₺1,90');
        expect(formatter.formatFiat(-0.01, { currency: 'TRY' })).toBe('-₺0,01');
        expect(formatter.formatFiat(1000000, { currency: 'TRY' })).toBe('₺1.000.000');
        expect(formatter.formatFiat(1000000.99, { currency: 'TRY' })).toBe('₺1.000.000');
        expect(formatter.formatFiat(7890.234, { currency: 'TRY', currencyDisplay: 'code' })).toBe(
            `7.890${SPACE.NNBSP}TRY`
        );
    });

    it('formats JPY (0 fraction digits) correctly', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatFiat(0, { currency: 'JPY' })).toBe('¥0');
        expect(formatter.formatFiat(1, { currency: 'JPY' })).toBe('¥1');
        expect(formatter.formatFiat(1.9, { currency: 'JPY' })).toBe('¥1');
        expect(formatter.formatFiat(100.5, { currency: 'JPY' })).toBe('¥100');
        expect(formatter.formatFiat(1234, { currency: 'JPY' })).toBe('¥1,234');
        expect(formatter.formatFiat(1234.99, { currency: 'JPY' })).toBe('¥1,234');
    });

    it('formats KRW (0 fraction digits) correctly', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('ko-KR'), testLogger);

        expect(formatter.formatFiat(0, { currency: 'KRW' })).toBe('₩0');
        expect(formatter.formatFiat(1500, { currency: 'KRW' })).toBe('₩1,500');
        expect(formatter.formatFiat(1500.7, { currency: 'KRW' })).toBe('₩1,500');
    });

    it('formats BHD (3 fraction digits) correctly', () => {
        const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

        expect(formatter.formatFiat(0, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}0`);
        expect(formatter.formatFiat(1, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}1`);
        expect(formatter.formatFiat(1.5, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}1.500`);
        expect(formatter.formatFiat(1.23, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}1.230`);
        expect(formatter.formatFiat(1.234, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}1.234`);
        expect(formatter.formatFiat(0.1, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}0.100`);
        expect(formatter.formatFiat(0.999, { currency: 'BHD' })).toBe(`BHD${SPACE.NNBSP}0.999`);
    });

    describe('Fiat Formatting - Different Locales and Display Options', () => {
        it('formats USD in en-US locale with symbol, code, and none display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1,234');
            expect(
                formatter.formatFiat(1234.56, { currency: 'USD', currencyDisplay: 'code' })
            ).toBe(`1,234${SPACE.NNBSP}USD`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'USD', currencyDisplay: 'none' })
            ).toBe('1,234');
            expect(formatter.formatFiat(0.99, { currency: 'USD', currencyDisplay: 'symbol' })).toBe(
                '$0.99'
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'USD', currencyDisplay: 'code' })
            ).toBe(`1,000,000${SPACE.NNBSP}USD`);
        });

        it('formats EUR in de-DE locale with symbol, code, and narrowSymbol display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('de-DE'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'EUR', currencyDisplay: 'symbol' })
            ).toBe(`1.234${SPACE.NNBSP}€`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'EUR', currencyDisplay: 'code' })
            ).toBe(`1.234${SPACE.NNBSP}EUR`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'EUR', currencyDisplay: 'narrowSymbol' })
            ).toBe(`1.234${SPACE.NNBSP}€`);
            expect(formatter.formatFiat(0.99, { currency: 'EUR', currencyDisplay: 'symbol' })).toBe(
                `0,99${SPACE.NNBSP}€`
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'EUR', currencyDisplay: 'code' })
            ).toBe(`1.000.000${SPACE.NNBSP}EUR`);
        });

        it('formats RUB in ru-RU locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('ru-RU'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'RUB', currencyDisplay: 'symbol' })
            ).toBe(`1${SPACE.NNBSP}234${SPACE.NNBSP}₽`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'RUB', currencyDisplay: 'code' })
            ).toBe(`1${SPACE.NNBSP}234${SPACE.NNBSP}RUB`);
            expect(formatter.formatFiat(0.99, { currency: 'RUB', currencyDisplay: 'symbol' })).toBe(
                `0,99${SPACE.NNBSP}₽`
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'RUB', currencyDisplay: 'code' })
            ).toBe(`1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}RUB`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'RUB', currencyDisplay: 'none' })
            ).toBe(`1${SPACE.NNBSP}234`);
        });

        it('formats GBP in en-GB locale with symbol, code, and name display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-GB'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'GBP', currencyDisplay: 'symbol' })
            ).toBe('£1,234');
            expect(
                formatter.formatFiat(1234.56, { currency: 'GBP', currencyDisplay: 'code' })
            ).toBe(`1,234${SPACE.NNBSP}GBP`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'GBP', currencyDisplay: 'name' })
            ).toContain('1,234');
            expect(formatter.formatFiat(0.99, { currency: 'GBP', currencyDisplay: 'symbol' })).toBe(
                '£0.99'
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'GBP', currencyDisplay: 'code' })
            ).toBe(`1,000,000${SPACE.NNBSP}GBP`);
        });

        it('formats JPY in ja-JP locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('ja-JP'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'JPY', currencyDisplay: 'symbol' })
            ).toContain('￥');
            expect(
                formatter.formatFiat(1234.56, { currency: 'JPY', currencyDisplay: 'code' })
            ).toContain('JPY');
            expect(
                formatter.formatFiat(0.99, { currency: 'JPY', currencyDisplay: 'symbol' })
            ).toContain('￥');
            expect(
                formatter.formatFiat(1000000.99, { currency: 'JPY', currencyDisplay: 'code' })
            ).toContain('JPY');
            expect(
                formatter.formatFiat(1234.56, { currency: 'JPY', currencyDisplay: 'none' })
            ).toBeTruthy();
        });

        it('formats CNY in zh-CN locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('zh-CN'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'CNY', currencyDisplay: 'symbol' })
            ).toBe('¥1,234');
            expect(
                formatter.formatFiat(1234.56, { currency: 'CNY', currencyDisplay: 'code' })
            ).toBe(`1,234${SPACE.NNBSP}CNY`);
            expect(formatter.formatFiat(0.99, { currency: 'CNY', currencyDisplay: 'symbol' })).toBe(
                '¥0.99'
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'CNY', currencyDisplay: 'code' })
            ).toBe(`1,000,000${SPACE.NNBSP}CNY`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'CNY', currencyDisplay: 'none' })
            ).toBe('1,234');
        });

        it('formats INR in hi-IN locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('hi-IN'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'INR', currencyDisplay: 'symbol' })
            ).toBe('₹1,234');
            expect(
                formatter.formatFiat(1234.56, { currency: 'INR', currencyDisplay: 'code' })
            ).toBe(`1,234${SPACE.NNBSP}INR`);
            expect(formatter.formatFiat(0.99, { currency: 'INR', currencyDisplay: 'symbol' })).toBe(
                '₹0.99'
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'INR', currencyDisplay: 'code' })
            ).toBe(`10,00,000${SPACE.NNBSP}INR`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'INR', currencyDisplay: 'none' })
            ).toBe('1,234');
        });

        it('formats TRY in tr-TR locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('tr-TR'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'TRY', currencyDisplay: 'symbol' })
            ).toBe('₺1.234');
            expect(
                formatter.formatFiat(1234.56, { currency: 'TRY', currencyDisplay: 'code' })
            ).toBe(`1.234${SPACE.NNBSP}TRY`);
            expect(formatter.formatFiat(0.99, { currency: 'TRY', currencyDisplay: 'symbol' })).toBe(
                '₺0,99'
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'TRY', currencyDisplay: 'code' })
            ).toBe(`1.000.000${SPACE.NNBSP}TRY`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'TRY', currencyDisplay: 'none' })
            ).toBe('1.234');
        });

        it('formats KZT in kk-KZ locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('kk-KZ'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'KZT', currencyDisplay: 'symbol' })
            ).toBe(`1${SPACE.NNBSP}234${SPACE.NNBSP}₸`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'KZT', currencyDisplay: 'code' })
            ).toBe(`1${SPACE.NNBSP}234${SPACE.NNBSP}KZT`);
            expect(formatter.formatFiat(0.99, { currency: 'KZT', currencyDisplay: 'symbol' })).toBe(
                `0,99${SPACE.NNBSP}₸`
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'KZT', currencyDisplay: 'code' })
            ).toBe(`1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}KZT`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'KZT', currencyDisplay: 'none' })
            ).toBe(`1${SPACE.NNBSP}234`);
        });

        it('formats UAH in uk-UA locale with symbol and code display', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('uk-UA'), testLogger);

            expect(
                formatter.formatFiat(1234.56, { currency: 'UAH', currencyDisplay: 'symbol' })
            ).toBe(`1${SPACE.NNBSP}234${SPACE.NNBSP}₴`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'UAH', currencyDisplay: 'code' })
            ).toBe(`1${SPACE.NNBSP}234${SPACE.NNBSP}UAH`);
            expect(formatter.formatFiat(0.99, { currency: 'UAH', currencyDisplay: 'symbol' })).toBe(
                `0,99${SPACE.NNBSP}₴`
            );
            expect(
                formatter.formatFiat(1000000.99, { currency: 'UAH', currencyDisplay: 'code' })
            ).toBe(`1${SPACE.NNBSP}000${SPACE.NNBSP}000${SPACE.NNBSP}UAH`);
            expect(
                formatter.formatFiat(1234.56, { currency: 'UAH', currencyDisplay: 'none' })
            ).toBe(`1${SPACE.NNBSP}234`);
        });
    });

    describe('Crypto Formatting - Different Locales and Display Options', () => {
        it('formats crypto with symbol in en-US locale - numbers >= 1000 (integer part only)', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(formatter.formatCrypto(33000.999, { symbol: 'BTC' })).toBe(
                `33,000${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1000.90932, { symbol: 'BTC' })).toBe(
                `1,000${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1234.56, { symbol: 'BTC' })).toBe(
                `1,234${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1000000.99, { symbol: 'ETH' })).toBe(
                `1,000,000${SPACE.NNBSP}ETH`
            );
            expect(formatter.formatCrypto(1000, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
        });

        it('formats crypto with symbol in en-US locale - numbers 1 to 1000 (up to 2 decimals, drop trailing zeros)', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(formatter.formatCrypto(99.999999940005, { symbol: 'BTC' })).toBe(
                `99.99${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(10.00932, { symbol: 'BTC' })).toBe(`10${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(10.0998, { symbol: 'BTC' })).toBe(
                `10.09${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1.0099, { symbol: 'BTC' })).toBe(`1${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(1.0965, { symbol: 'BTC' })).toBe(`1.09${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(1.8051, { symbol: 'BTC' })).toBe(`1.8${SPACE.NNBSP}BTC`);
        });

        it('formats crypto with symbol in en-US locale - numbers 0 to 1 (up to 3 significant digits, drop trailing zeros)', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(formatter.formatCrypto(0.000143945, { symbol: 'BTC' })).toBe(
                `0.000143${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(0.00100099, { symbol: 'BTC' })).toBe(
                `0.001${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(0.00000099992, { symbol: 'BTC' })).toBe(
                `0.000000999${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(0.99, { symbol: 'BTC' })).toBe(`0.99${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(0.000123, { symbol: 'DOGE' })).toBe(
                `0.000123${SPACE.NNBSP}DOGE`
            );
        });

        it('formats crypto without symbol in en-US locale', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(formatter.formatCrypto(33000.999, { currencyDisplay: 'none' })).toBe('33,000');
            expect(formatter.formatCrypto(1.8051, { currencyDisplay: 'none' })).toBe('1.8');
            expect(formatter.formatCrypto(0.000143945, { currencyDisplay: 'none' })).toBe(
                '0.000143'
            );
            expect(formatter.formatCrypto(1000000.99, { currencyDisplay: 'none' })).toBe(
                '1,000,000'
            );
            expect(formatter.formatCrypto(1.234, { currencyDisplay: 'none' })).toBe('1.23');
        });

        it('formats crypto with symbol in de-DE locale - different number ranges', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('de-DE'), testLogger);

            expect(formatter.formatCrypto(33000.999, { symbol: 'BTC' })).toBe(
                `33.000${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1.8051, { symbol: 'BTC' })).toBe(`1,8${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(0.000143945, { symbol: 'BTC' })).toBe(
                `0,000143${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1000000.99, { symbol: 'ETH' })).toBe(
                `1.000.000${SPACE.NNBSP}ETH`
            );
            expect(formatter.formatCrypto(1.234, { symbol: 'USDT' })).toBe(
                `1,23${SPACE.NNBSP}USDT`
            );
        });

        it('formats crypto with symbol in ru-RU locale - different number ranges', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('ru-RU'), testLogger);

            expect(formatter.formatCrypto(33000.999, { symbol: 'BTC' })).toBe(
                `33${SPACE.NNBSP}000${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1.8051, { symbol: 'BTC' })).toBe(`1,8${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(0.000143945, { symbol: 'BTC' })).toBe(
                `0,000143${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1.234, { symbol: 'USDT' })).toBe(
                `1,23${SPACE.NNBSP}USDT`
            );
        });
    });

    describe('Edge Cases and Boundary Values', () => {
        it('handles zero values across different locales and display options', () => {
            const locales = ['en-US', 'de-DE', 'fr-FR', 'ru-RU', 'zh-CN'];

            locales.forEach(locale => {
                const formatter = new NumberFormatter(
                    new WebNumberFormatLocale(locale),
                    testLogger
                );
                expect(
                    formatter.formatFiat(0, { currency: 'USD', currencyDisplay: 'symbol' })
                ).toBeTruthy();
                expect(
                    formatter.formatFiat(0, { currency: 'EUR', currencyDisplay: 'code' })
                ).toBeTruthy();
                expect(formatter.formatCrypto(0, { symbol: 'BTC' })).toBe(`0${SPACE.NNBSP}BTC`);
                expect(formatter.formatCrypto(0, { currencyDisplay: 'none' })).toBe('0');
            });
        });

        it('handles negative values across different locales', () => {
            const formatterUS = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);
            const formatterDE = new NumberFormatter(new WebNumberFormatLocale('de-DE'), testLogger);
            const formatterFR = new NumberFormatter(new WebNumberFormatLocale('fr-FR'), testLogger);

            expect(
                formatterUS.formatFiat(-1234.56, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('-$1,234');
            expect(
                formatterDE.formatFiat(-1234.56, { currency: 'EUR', currencyDisplay: 'code' })
            ).toContain('-');
            expect(
                formatterFR.formatFiat(-1234.56, { currency: 'EUR', currencyDisplay: 'symbol' })
            ).toContain('-');
            expect(formatterUS.formatCrypto(-0.000123, { symbol: 'BTC' })).toBe(
                `-0.000123${SPACE.NNBSP}BTC`
            );
            expect(formatterUS.formatCrypto(-1234.56, { currencyDisplay: 'none' })).toBe('-1,234');
        });

        it('handles very large numbers across different locales', () => {
            const formatterUS = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);
            const formatterDE = new NumberFormatter(new WebNumberFormatLocale('de-DE'), testLogger);
            const formatterIN = new NumberFormatter(new WebNumberFormatLocale('hi-IN'), testLogger);

            const largeNumber = 999999999.99;

            expect(
                formatterUS.formatFiat(largeNumber, { currency: 'USD', currencyDisplay: 'code' })
            ).toBe(`999,999,999${SPACE.NNBSP}USD`);
            expect(
                formatterDE.formatFiat(largeNumber, { currency: 'EUR', currencyDisplay: 'code' })
            ).toContain('999.999.999');
            expect(
                formatterIN.formatFiat(largeNumber, { currency: 'INR', currencyDisplay: 'code' })
            ).toContain('INR');
            expect(formatterUS.formatCrypto(largeNumber, { symbol: 'BTC' })).toBe(
                `999,999,999${SPACE.NNBSP}BTC`
            );
        });

        it('handles very small numbers with fullPrecision option', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(
                formatter.formatFiat(0.000000123, {
                    currency: 'USD',
                    currencyDisplay: 'symbol',
                    fullPrecision: true
                })
            ).toBe('$0.000000123');
            expect(
                formatter.formatCrypto(0.000000123456789, { symbol: 'USDT', fullPrecision: true })
            ).toBe(`0.000000123456789${SPACE.NNBSP}USDT`);
            expect(
                formatter.formatCrypto(0.000000123456789, {
                    currencyDisplay: 'none',
                    fullPrecision: true
                })
            ).toBe('0.000000123456789');
            expect(
                formatter.formatFiat(0.000000123, {
                    currency: 'EUR',
                    currencyDisplay: 'code',
                    fullPrecision: true
                })
            ).toContain('EUR');
            expect(
                formatter.formatCrypto(0.000143945, { symbol: 'BTC', fullPrecision: true })
            ).toBe(`0.000143945${SPACE.NNBSP}BTC`);
        });

        it('handles numbers between 1 and 1000 with proper decimal truncation (no rounding, drop trailing zeros)', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(
                formatter.formatFiat(1.001, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1');
            expect(
                formatter.formatFiat(1.004, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1');
            expect(
                formatter.formatFiat(1.005, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1');
            expect(
                formatter.formatFiat(1.045, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1.04');
            expect(
                formatter.formatFiat(999.999, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$999.99');
            expect(formatter.formatCrypto(1.8051, { symbol: 'BTC' })).toBe(`1.8${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(10.00932, { symbol: 'BTC' })).toBe(`10${SPACE.NNBSP}BTC`);
        });

        it('handles numbers exactly at 1000 boundary (fractional part dropped for >= 1000)', () => {
            const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), testLogger);

            expect(
                formatter.formatFiat(999.99, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$999.99');
            expect(formatter.formatFiat(1000, { currency: 'USD', currencyDisplay: 'symbol' })).toBe(
                '$1,000'
            );
            expect(
                formatter.formatFiat(1000.01, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1,000');
            expect(
                formatter.formatFiat(1000.90932, { currency: 'USD', currencyDisplay: 'symbol' })
            ).toBe('$1,000');
            expect(formatter.formatCrypto(999.99, { symbol: 'BTC' })).toBe(
                `999.99${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(1000, { symbol: 'BTC' })).toBe(`1,000${SPACE.NNBSP}BTC`);
            expect(formatter.formatCrypto(1000.01, { symbol: 'BTC' })).toBe(
                `1,000${SPACE.NNBSP}BTC`
            );
            expect(formatter.formatCrypto(33000.999, { symbol: 'BTC' })).toBe(
                `33,000${SPACE.NNBSP}BTC`
            );
        });
    });
});
