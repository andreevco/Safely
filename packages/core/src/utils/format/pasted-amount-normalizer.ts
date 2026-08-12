export type NormalizedPastedAmount = { value: string; status: 'ok' | 'ambiguous' };

export class PastedAmountNormalizer {
    private static readonly GROUP_WHITESPACE = [0x20, 0xa0, 0x202f, 0x2009, 0x27, 0x2019]
        .map(code => String.fromCharCode(code))
        .join('');

    private static readonly AMBIGUOUS: NormalizedPastedAmount = { value: '', status: 'ambiguous' };

    private static resolved(value: string): NormalizedPastedAmount {
        return { value, status: 'ok' };
    }

    public normalize(raw: string): NormalizedPastedAmount {
        const t = raw.trim();

        if (t === '') return PastedAmountNormalizer.resolved('');
        if (/[-+−]/.test(t)) return PastedAmountNormalizer.AMBIGUOUS;
        if (new RegExp(`[^0-9.,${PastedAmountNormalizer.GROUP_WHITESPACE}]`).test(t))
            return PastedAmountNormalizer.AMBIGUOUS;

        const whitespace = this.normalizeWhitespace(t);
        if (!whitespace) return PastedAmountNormalizer.AMBIGUOUS;

        const { cleaned, hasWhitespace } = whitespace;

        const bare = cleaned.replace(/ /g, '');
        const dotCount = this.countChar(bare, '.');
        const commaCount = this.countChar(bare, ',');

        if (dotCount === 0 && commaCount === 0) {
            if (hasWhitespace && !this.isValidGrouping(cleaned, ' ')) {
                return PastedAmountNormalizer.AMBIGUOUS;
            }

            return PastedAmountNormalizer.resolved(this.trimInteger(bare));
        }

        if (dotCount > 0 && commaCount > 0) {
            return this.parseBothSeparators(bare, hasWhitespace);
        }

        const separator = dotCount > 0 ? '.' : ',';
        const count = dotCount > 0 ? dotCount : commaCount;

        if (hasWhitespace) return this.parseWhitespaceDecimal(cleaned, separator, count);
        if (count >= 2) return this.parseGroupedInteger(bare, separator);

        return this.resolveSingleSeparator(bare, separator);
    }

    private normalizeWhitespace(t: string): { cleaned: string; hasWhitespace: boolean } | null {
        const cleaned = t.replace(
            new RegExp(`[${PastedAmountNormalizer.GROUP_WHITESPACE}]`, 'g'),
            ' '
        );
        const whitespaceRun = / +/g;
        let hasWhitespace = false;
        let run: RegExpExecArray | null;

        while ((run = whitespaceRun.exec(cleaned)) !== null) {
            hasWhitespace = true;
            const flankedByDigits =
                this.isDigit(cleaned[run.index - 1]) &&
                this.isDigit(cleaned[run.index + run[0].length]);

            if (run[0].length !== 1 || !flankedByDigits) return null;
        }

        return { cleaned, hasWhitespace };
    }

    private parseBothSeparators(bare: string, hasWhitespace: boolean): NormalizedPastedAmount {
        const decimalChar = bare.lastIndexOf('.') > bare.lastIndexOf(',') ? '.' : ',';
        const groupChar = decimalChar === '.' ? ',' : '.';

        if (this.countChar(bare, decimalChar) !== 1) return PastedAmountNormalizer.AMBIGUOUS;
        if (bare.lastIndexOf(groupChar) > bare.indexOf(decimalChar))
            return PastedAmountNormalizer.AMBIGUOUS;
        if (hasWhitespace) return PastedAmountNormalizer.AMBIGUOUS;

        const [intSide, fracSide] = bare.split(decimalChar);
        if (/\D/.test(fracSide)) return PastedAmountNormalizer.AMBIGUOUS;
        if (!this.isValidGrouping(intSide, groupChar)) return PastedAmountNormalizer.AMBIGUOUS;

        return PastedAmountNormalizer.resolved(
            this.joinCanonical(this.trimInteger(intSide.split(groupChar).join('')), fracSide)
        );
    }

    private parseWhitespaceDecimal(
        cleaned: string,
        separator: string,
        count: number
    ): NormalizedPastedAmount {
        if (count !== 1) return PastedAmountNormalizer.AMBIGUOUS;

        const [intSide, fracSide] = cleaned.split(separator);
        if (fracSide.includes(' ') || /\D/.test(fracSide.replace(/ /g, '')))
            return PastedAmountNormalizer.AMBIGUOUS;
        if (!this.isValidGrouping(intSide, ' ')) return PastedAmountNormalizer.AMBIGUOUS;

        return PastedAmountNormalizer.resolved(
            this.joinCanonical(this.trimInteger(intSide.replace(/ /g, '')), fracSide)
        );
    }

    private parseGroupedInteger(bare: string, separator: string): NormalizedPastedAmount {
        if (!this.isValidGrouping(bare, separator)) return PastedAmountNormalizer.AMBIGUOUS;

        return PastedAmountNormalizer.resolved(this.trimInteger(bare.split(separator).join('')));
    }

    private resolveSingleSeparator(bare: string, separator: string): NormalizedPastedAmount {
        const [before, after] = bare.split(separator);

        if (before === '') {
            return after === ''
                ? PastedAmountNormalizer.AMBIGUOUS
                : PastedAmountNormalizer.resolved(`0.${after}`);
        }
        if (after === '') return PastedAmountNormalizer.resolved(this.trimInteger(before));
        if (after.length !== 3 || /^0+$/.test(before) || before.length >= 4) {
            return PastedAmountNormalizer.resolved(
                this.joinCanonical(this.trimInteger(before), after)
            );
        }

        return PastedAmountNormalizer.AMBIGUOUS;
    }

    private isDigit(char: string | undefined): boolean {
        return char !== undefined && char >= '0' && char <= '9';
    }

    private countChar(value: string, char: string): number {
        let count = 0;

        for (const ch of value) {
            if (ch === char) count++;
        }

        return count;
    }

    private trimInteger(digits: string): string {
        const trimmed = digits.replace(/^0+/, '');

        return trimmed === '' ? '0' : trimmed;
    }

    private joinCanonical(intPart: string, fracPart: string): string {
        return fracPart === '' ? intPart : `${intPart}.${fracPart}`;
    }

    private isValidGrouping(integerWithSeparators: string, groupChar: string): boolean {
        const parts = integerWithSeparators.split(groupChar);
        if (parts.length < 2) return false;
        if (parts.some(part => part === '' || /\D/.test(part))) return false;

        const lengths = parts.map(part => part.length);
        const first = lengths[0];
        const last = lengths[lengths.length - 1];
        const interior = lengths.slice(1, -1);

        const western = first >= 1 && first <= 3 && lengths.slice(1).every(length => length === 3);
        const indian =
            last === 3 && first >= 1 && first <= 2 && interior.every(length => length === 2);

        return western || indian;
    }
}
