import { useCallback, useMemo, useRef, useState } from 'react';

import { useImportWords, type WordsNumber, type IHandlePasscodeConfig, useToast } from '@safely/ux';

import { Button } from '../../shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../../shared/ui/dialog';
import { Input } from '../../shared/ui/input';

export function ImportWalletDialog({
    open,
    onOpenChange
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const toast = useToast();
    const [wordsNumber, setWordsNumber] = useState<WordsNumber>(12);

    const formKey = useMemo(() => `import-wallet-${wordsNumber}`, [wordsNumber]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Import wallet</DialogTitle>
                    <DialogDescription>
                        Enter your {wordsNumber}-word recovery phrase. You can paste multiple words
                        into any field.
                    </DialogDescription>
                </DialogHeader>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-zinc-700">Words</div>
                    <select
                        className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={wordsNumber}
                        onChange={e => setWordsNumber(Number(e.target.value) as WordsNumber)}
                    >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                    </select>
                </div>

                <ImportWalletWordsForm
                    key={formKey}
                    wordsNumber={wordsNumber}
                    onDone={() => onOpenChange(false)}
                    onToast={toast}
                />
            </DialogContent>
        </Dialog>
    );
}

function ImportWalletWordsForm({
    wordsNumber,
    onDone,
    onToast
}: {
    wordsNumber: WordsNumber;
    onDone: () => void;
    onToast: ReturnType<typeof useToast>;
}) {
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [touched, setTouched] = useState<boolean[]>(() =>
        Array.from({ length: wordsNumber }, () => false)
    );

    const focusInput = useCallback((index: number) => {
        inputsRef.current[index]?.focus();
    }, []);

    const markTouched = useCallback((index: number) => {
        setTouched(prev => {
            if (prev[index]) return prev;
            const copy = prev.slice();
            copy[index] = true;
            return copy;
        });
    }, []);

    const handlePasscode = useCallback(
        (mnemonic: string[], { resetMnemonic }: IHandlePasscodeConfig) => {
            onToast({
                message: `Mnemonic accepted (${mnemonic.length} words)`,
                type: 'success',
                duration: 2500
            });

            resetMnemonic();
            onDone();
        },
        [onDone, onToast]
    );

    const { mnemonic, validations, isDirty, onChange, handleKeyPress, handleSubmit } =
        useImportWords({
            wordsNumber,
            onPasscode: handlePasscode
        });

    const filled = useMemo(() => mnemonic.filter(Boolean).length, [mnemonic]);

    return (
        <>
            <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-zinc-700">
                    Filled: {filled}/{wordsNumber}
                </div>
                <div className="text-sm text-zinc-500"> </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mnemonic.map((value, index) => {
                    const isEmptyError = (submitAttempted || touched[index]) && !value;
                    const isInvalidWordError = Boolean(value) && !validations[index];
                    const isInvalid = isEmptyError || isInvalidWordError;
                    return (
                        <div key={index} className="">
                            <Input
                                ref={el => {
                                    inputsRef.current[index] = el;
                                }}
                                style={{
                                    border: isInvalid ? '1px solid red' : undefined
                                }}
                                value={value}
                                onChange={e =>
                                    onChange(e.target.value, {
                                        index,
                                        focusInput
                                    })
                                }
                                onBlur={() => markTouched(index)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleKeyPress(index, focusInput);
                                    }
                                }}
                                aria-invalid={isInvalid}
                                placeholder="word"
                                inputMode="text"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                        </div>
                    );
                })}
            </div>

            <DialogFooter>
                <Button variant="secondary" onClick={() => onDone()}>
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        setSubmitAttempted(true);
                        handleSubmit(focusInput);
                    }}
                    disabled={!isDirty}
                >
                    Import
                </Button>
            </DialogFooter>
        </>
    );
}
