import { Locale } from 'expo-localization';

import { FiatCurrencyDisplay, NumberFormatLocale, SignedCurrencyAffixes } from '@safely/core';

export class MobileNumberFormatLocale implements NumberFormatLocale {
    private readonly locale: string;

    public readonly decimalSeparator: string;
    public readonly groupSeparator: string;
    public readonly primaryGroupSize: number;
    public readonly secondaryGroupSize: number;

    constructor(expoLocale: Locale) {
        this.locale = expoLocale.languageCode ?? 'en-US';

        this.decimalSeparator = expoLocale.decimalSeparator ?? '.';
        this.groupSeparator = expoLocale.digitGroupingSeparator ?? ' ';
        this.primaryGroupSize = 3;
        this.secondaryGroupSize = 3;
    }

    public getCurrencyAffixes(
        currency: string,
        display: Exclude<FiatCurrencyDisplay, 'none'>
    ): SignedCurrencyAffixes {
        const options: Intl.NumberFormatOptions = {
            style: 'currency',
            currency,
            currencyDisplay: display,
            currencySign: 'standard',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: false
        };

        const formatter = this.createIntlFormatter(options);

        const positiveParts = formatter.formatToParts(1);
        const negativeParts = formatter.formatToParts(-1);

        const positive = this.extractAffixes(positiveParts);
        const negative = this.extractAffixes(negativeParts);

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

    private createIntlFormatter(options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
        return new Intl.NumberFormat(this.locale, {
            numberingSystem: 'latn',
            useGrouping: true,
            ...options
        });
    }
}
