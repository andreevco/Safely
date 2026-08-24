export type PasscodeStorage = {
    get: () => Promise<string | null>;
    set: (passcode: string) => Promise<void>;
};
