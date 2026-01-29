import { FiatCurrencyDisplay, SignedCurrencyAffixes } from './types';

export interface NumberFormatLocale {
    readonly decimalSeparator: string;
    readonly groupSeparator: string;
    readonly primaryGroupSize: number;
    readonly secondaryGroupSize: number;

    getCurrencyAffixes(
        currency: string,
        display: Exclude<FiatCurrencyDisplay, 'none'>
    ): SignedCurrencyAffixes;
}

export class WebNumberFormatLocale implements NumberFormatLocale {
    public readonly decimalSeparator: string;
    public readonly groupSeparator: string;
    public readonly primaryGroupSize: number;
    public readonly secondaryGroupSize: number;

    constructor(private readonly locale: string) {
        const groupingInfo = this.extractGroupingInfo();

        this.decimalSeparator = groupingInfo.decimalSeparator;
        this.groupSeparator =
            groupingInfo.groupSeparator === groupingInfo.decimalSeparator
                ? ''
                : groupingInfo.groupSeparator;
        this.primaryGroupSize = groupingInfo.primaryGroupSize;
        this.secondaryGroupSize = groupingInfo.secondaryGroupSize;
    }

    public getCurrencyAffixes(
        currency: string,
        display: Exclude<FiatCurrencyDisplay, 'none'>
    ): SignedCurrencyAffixes {
        const formatter = this.createFormatter({
            style: 'currency',
            currency,
            currencyDisplay: display,
            currencySign: 'standard',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: false
        });

        const positive = this.extractAffixes(formatter.formatToParts(1));
        const negative = this.extractAffixes(formatter.formatToParts(-1));

        if (display === 'code') {
            this.normalizeCurrencyCodePosition(positive);
            this.normalizeCurrencyCodePosition(negative);
        }

        return { positive, negative };
    }

    private normalizeCurrencyCodePosition(affixes: { prefix: string; suffix: string }): void {
        if (affixes.suffix === '') {
            affixes.suffix = ' ' + affixes.prefix.replace(/[\s\u00A0]+/g, '');
            affixes.prefix = '';
        }
    }

    private extractAffixes(parts: Intl.NumberFormatPart[]): { prefix: string; suffix: string } {
        const numberPartTypes = new Set(['integer', 'group', 'decimal', 'fraction']);

        let firstNumberIndex = -1;
        let lastNumberIndex = -1;

        for (let i = 0; i < parts.length; i++) {
            if (numberPartTypes.has(parts[i].type)) {
                if (firstNumberIndex === -1) firstNumberIndex = i;
                lastNumberIndex = i;
            }
        }

        const isSignPart = (p: Intl.NumberFormatPart) =>
            p.type === 'minusSign' || p.type === 'plusSign';

        const prefix = parts
            .slice(0, firstNumberIndex)
            .filter(p => !isSignPart(p))
            .map(p => p.value)
            .join('');

        const suffix = parts
            .slice(lastNumberIndex + 1)
            .filter(p => !isSignPart(p))
            .map(p => p.value)
            .join('');

        return { prefix, suffix };
    }

    private extractGroupingInfo() {
        const defaults = {
            decimalSeparator: '.',
            groupSeparator: ' ',
            primaryGroupSize: 3,
            secondaryGroupSize: 3
        };

        const decimalSeparator =
            this.createFormatter()
                .formatToParts(1.1)
                .find(p => p.type === 'decimal')?.value ?? defaults.decimalSeparator;

        const parts = this.createFormatter().formatToParts(1234567890123);
        const groupSeparator =
            parts.find(p => p.type === 'group')?.value ?? defaults.groupSeparator;

        const groupLengths = this.calculateGroupLengths(parts);
        const reversedLengths = groupLengths.slice().reverse();

        return {
            decimalSeparator,
            groupSeparator,
            primaryGroupSize: reversedLengths[0] ?? defaults.primaryGroupSize,
            secondaryGroupSize:
                reversedLengths[1] ?? reversedLengths[0] ?? defaults.secondaryGroupSize
        };
    }

    private calculateGroupLengths(parts: Intl.NumberFormatPart[]): number[] {
        const lengths: number[] = [];
        let currentLength = 0;

        for (const part of parts) {
            if (part.type === 'integer') {
                currentLength += part.value.length;
            } else if (part.type === 'group') {
                lengths.push(currentLength);
                currentLength = 0;
            }
        }

        if (currentLength > 0) {
            lengths.push(currentLength);
        }

        return lengths;
    }

    private createFormatter(options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
        return new Intl.NumberFormat(this.locale, {
            numberingSystem: 'latn',
            useGrouping: true,
            ...options
        });
    }
}
