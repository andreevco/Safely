import { create } from 'zustand';

export class PasscodePromptCancelledError extends Error {
    constructor() {
        super('Passcode prompt cancelled');

        this.name = 'PasscodePromptCancelledError';
    }
}

type PasscodePromptRequest = {
    resolve: () => void;
    reject: (reason: Error) => void;
};

interface PasscodePromptState {
    request: PasscodePromptRequest | null;
    open: (request: PasscodePromptRequest) => void;
    close: () => void;
}

export const usePasscodePromptStore = create<PasscodePromptState>(set => ({
    request: null,
    open: request => set({ request }),
    close: () => set({ request: null })
}));

export const passcodePrompt = {
    request(): Promise<void> {
        return new Promise((resolve, reject) => {
            usePasscodePromptStore.getState().open({ resolve, reject });
        });
    }
};
