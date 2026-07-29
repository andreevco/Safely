import { describe, expect, it } from 'vitest';

import { Logger } from '@safely/sync';

import { NumberFormatter, WebNumberFormatLocale } from '../src';

const formatter = new NumberFormatter(new WebNumberFormatLocale('en-US'), new Logger());

const resolved = (raw: string, value: string) =>
    expect(formatter.normalizePastedInput(raw)).toEqual({ value, status: 'ok' });

const ambiguous = (raw: string) =>
    expect(formatter.normalizePastedInput(raw)).toEqual({ value: '', status: 'ambiguous' });

describe('NumberFormatter.normalizePastedInput', () => {
    it('resolves the reported cross-locale bug repros to the correct magnitude', () => {
        resolved('0.123', '0.123');
        resolved('0,123', '0.123');
    });

    it('parses grouped values with an explicit decimal separator', () => {
        resolved('1.234,56', '1234.56');
        resolved('1,234.56', '1234.56');
        resolved('1,234,567.89', '1234567.89');
        resolved('1.234.567,89', '1234567.89');
        resolved('1,234,567', '1234567');
        resolved('12,34,567', '1234567');
    });

    it('treats a single separator with a non-3-digit tail as a decimal', () => {
        resolved('1,00', '1.00');
        resolved('1.00', '1.00');
        resolved('1,23', '1.23');
        resolved('1234,567', '1234.567');
        resolved('1234.567', '1234.567');
    });

    it('uses structural certainty to keep unambiguous single-separator cases', () => {
        resolved('.5', '0.5');
        resolved(',234', '0.234');
        resolved('5.', '5');
        resolved('5', '5');
        resolved('007', '7');
    });

    it('handles whitespace and apostrophe grouping', () => {
        resolved('1 234,56', '1234.56');
        resolved('1 234,56', '1234.56');
        resolved("1'234.56", '1234.56');
        resolved('1 234 567', '1234567');
    });

    it('clears on empty input without flagging ambiguity', () => {
        resolved('', '');
    });

    it('rejects the genuinely ambiguous 1000x cross-locale cases', () => {
        ambiguous('1,234');
        ambiguous('1.234');
        ambiguous('12,345');
    });

    it('rejects structurally malformed numbers', () => {
        ambiguous('1.23,00');
        ambiguous('1,2.3');
        ambiguous('1,2,3');
        ambiguous('1.2.3');
        ambiguous('1 2 3');
        ambiguous('1.234 567,89');
    });

    it('rejects signs and garbage', () => {
        ambiguous('-5');
        ambiguous('1a2');
    });
});
