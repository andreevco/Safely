import { useCallback, useMemo, useState } from 'react';

import { saf751 } from '@safely/sync';

import { useLogger } from '../../../../shared';
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
    const logger = useLogger('import-seed');
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
        // Never log the words themselves — only the count, which is safe.
        logger.info('seed phrase submitted', { wordCount: words.length });
        saf751('ux.seedPhrase.submit', {
            words: words.length,
            chars: value.length,
            wordLengths: words.map(word => word.length).join(','),
            allInWordlist: words.every(word => isValidMnemonicWord(word))
        });

        if (words.length !== 12 && words.length !== 24) {
            logger.warn('seed phrase rejected: invalid word count', { wordCount: words.length });
            setError('Secret recovery phrase must be 12 or 24 words');
            return;
        }

        const invalidWord = words.find(word => !isValidMnemonicWord(word));
        if (invalidWord) {
            logger.warn('seed phrase rejected: contains a word outside the BIP39 wordlist');
            setError(`Invalid word: "${invalidWord}"`);
            return;
        }

        saf751('ux.seedPhrase.onSubmit:start');
        onSubmit(words);
        saf751('ux.seedPhrase.onSubmit:ok');
    }, [words, value, onSubmit, logger]);

    return {
        value,
        error,
        isDirty,
        isValid,
        onChange,
        handleSubmit
    };
};
