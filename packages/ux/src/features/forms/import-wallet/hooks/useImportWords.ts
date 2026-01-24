import { useCallback, useMemo, useState } from 'react';

import { IOnChangeConfig, IUseImportWordsParams, FocusInput } from '../types';
import {
    applyMnemonicInput,
    getEmptyMnemonic,
    getEmptyWordIndex,
    getInvalidWordIndex,
    isValidMnemonicWord,
    sleep
} from '../utils';

export const useImportWords = ({ wordsNumber, onPasscode }: IUseImportWordsParams) => {
    const [mnemonic, setMnemonic] = useState<string[]>(() => getEmptyMnemonic(wordsNumber));

    const onChange = useCallback(
        (newValue: string, { index, focusInput }: IOnChangeConfig) => {
            setMnemonic(prev => {
                const { next, focusIndex } = applyMnemonicInput({
                    prev,
                    index,
                    rawValue: newValue,
                    wordsNumber
                });

                if (focusIndex !== undefined) {
                    focusInput(focusIndex);
                }

                return next;
            });
        },
        [wordsNumber]
    );

    const validations = useMemo(
        () => mnemonic.map(item => item === '' || isValidMnemonicWord(item)),
        [mnemonic]
    );

    const isValid = useMemo(() => validations.every(Boolean), [validations]);

    const isDirty = useMemo(() => mnemonic.some(Boolean), [mnemonic]);

    const handleSubmit = useCallback(
        (focusInput: FocusInput) => {
            const emptyIndex = getEmptyWordIndex(mnemonic);
            if (emptyIndex !== -1) {
                focusInput(emptyIndex);
                return;
            }

            const invalidIndex = getInvalidWordIndex(mnemonic);
            if (invalidIndex !== -1) {
                focusInput(invalidIndex);
                return;
            }

            onPasscode(mnemonic, {
                resetMnemonic: async () => {
                    setMnemonic(getEmptyMnemonic(wordsNumber));
                    await sleep(200);
                    focusInput(0);
                }
            });
        },
        [mnemonic, onPasscode, wordsNumber]
    );

    const handleKeyPress = useCallback(
        (index: number, focusInput: FocusInput) => {
            if (index === wordsNumber - 1) {
                return handleSubmit(focusInput);
            }

            focusInput(index + 1);
        },
        [wordsNumber, handleSubmit]
    );

    return {
        mnemonic,
        validations,
        isValid,
        isDirty,
        onChange,
        handleSubmit,
        handleKeyPress
    };
};
