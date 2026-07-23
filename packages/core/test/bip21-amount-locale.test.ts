import { describe, expect, it } from 'vitest';

import { Logger } from '@safely/sync';

import { NumberFormatter, WebNumberFormatLocale } from '../src';

const testLogger = new Logger();
const BTC_DECIMALS = 8;

function formatterFor(locale: string): NumberFormatter {
    return new NumberFormatter(new WebNumberFormatLocale(locale), testLogger);
}

function enParse(amount: string): string {
    return formatterFor('en-US').parseInput(amount, BTC_DECIMALS).parsed.toString();
}

describe('NumberFormatter.normalizeCanonicalInput localizes and drops junk', () => {
    it('accepts every canonical decimal (incl. ones paste-normalize marks ambiguous)', () => {
        const f = formatterFor('en-US');
        for (const v of ['0', '1', '0.001', '1.234', '5.678', '12.500', '0.12345678', '1000']) {
            expect(f.normalizeCanonicalInput(v)).toEqual({ value: v, status: 'ok' });
        }
    });

    it('marks non-canonical as ambiguous', () => {
        const f = formatterFor('en-US');
        for (const v of ['1 000', '1e3', '1.2.3', 'abc', '', '.5', '5.', '-1', '+1']) {
            expect(f.normalizeCanonicalInput(v).status).toBe('ambiguous');
        }
    });
    it('canonical -> localized display, then parseInput round-trips on every locale', () => {
        for (const locale of ['en-US', 'de-DE', 'es-UY', 'ru-RU', 'pt-BR']) {
            const f = formatterFor(locale);
            for (const amount of ['0.001', '1.234', '12.5', '0.12345678', '1', '1000.5']) {
                const norm = f.normalizeCanonicalInput(amount);
                expect(norm.status).toBe('ok');
                expect(f.parseInput(norm.value, BTC_DECIMALS).parsed.toString()).toBe(
                    enParse(amount)
                );
            }
        }
    });

    it('0.001 no longer corrupts to 1 on comma-locale', () => {
        expect(formatterFor('de-DE').normalizeCanonicalInput('0.001').value).toBe('0,001');
        expect(formatterFor('es-UY').normalizeCanonicalInput('0.001').value).toBe('0,001');
    });

    it('non-canonical input is reported ambiguous (form drops it)', () => {
        for (const bad of ['0,0001', '1 000.5', '1e3', '1.2.3', 'abc', '']) {
            expect(formatterFor('de-DE').normalizeCanonicalInput(bad).status).toBe('ambiguous');
        }
    });
});
