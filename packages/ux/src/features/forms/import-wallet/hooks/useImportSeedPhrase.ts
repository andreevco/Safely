import { useCallback, useMemo, useState } from 'react';

import { isValidMnemonicWord, normalizeInput } from '../utils';

export interface UseImportSeedPhraseParams {
    onSubmit: (mnemonic: string[]) => void;
}

export interface UseImportSeedPhraseResult {
    value: string;
    error: string | null;
    isDirty: boolean;
    isValid: boolean;
    onChange: (value: string) => void;
    handleSubmit: () => void;
}

export const useImportSeedPhrase = ({
    onSubmit
}: UseImportSeedPhraseParams): UseImportSeedPhraseResult => {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const words = useMemo(() => normalizeInput(value), [value]);

    const isDirty = words.length > 0;

    const isValid = useMemo(() => {
        if (words.length !== 12 && words.length !== 24) {
            return false;
        }
        return words.every(word => isValidMnemonicWord(word));
    }, [words]);

    const onChange = useCallback((newValue: string) => {
        setValue(newValue);
        setError(null);
    }, []);

    const handleSubmit = useCallback(() => {
        if (words.length !== 12 && words.length !== 24) {
            setError('Secret recovery phrase must be 12 or 24 words');
            return;
        }

        const invalidWord = words.find(word => !isValidMnemonicWord(word));
        if (invalidWord) {
            setError(`Invalid word: "${invalidWord}"`);
            return;
        }

        onSubmit(words);
    }, [words, onSubmit]);

    return {
        value,
        error,
        isDirty,
        isValid,
        onChange,
        handleSubmit
    };
};
