export interface TextSelectionRange {
    start: number;
    end: number;
}

export interface SeedPhraseMaskResult {
    value: string;
    selection: TextSelectionRange;
    changed: boolean;
}

const sanitizeSeedPhraseInput = (value: string) => {
    'worklet';
    return value
        .toLowerCase()
        .replace(/\./g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[^a-z ]/g, '')
        .replace(/ {2,}/g, ' ');
};

const mapSelectionOffset = (value: string, offset: number) => {
    'worklet';
    return sanitizeSeedPhraseInput(value.slice(0, offset)).length;
};

export const maskSeedPhraseInput = (
    value: string,
    selection: TextSelectionRange
): SeedPhraseMaskResult => {
    'worklet';
    const formatted = sanitizeSeedPhraseInput(value);

    if (formatted === value) {
        return {
            changed: false,
            value,
            selection
        };
    }

    return {
        changed: true,
        value: formatted,
        selection: {
            start: mapSelectionOffset(value, selection.start),
            end: mapSelectionOffset(value, selection.end)
        }
    };
};
