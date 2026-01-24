export type WordsNumber = 12 | 24;
export type FocusInput = (index: number) => void;

export interface IHandlePasscodeConfig {
    resetMnemonic: () => void;
}

export interface IUseImportWordsParams {
    wordsNumber: WordsNumber;
    onPasscode: (mnemonic: string[], config: IHandlePasscodeConfig) => void;
}

export interface IOnChangeConfig {
    index: number;
    focusInput: FocusInput;
}
