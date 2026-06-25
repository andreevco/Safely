interface ShouldShowSyncOnboardingParams {
    forceOpen: boolean;
    isFocused: boolean;
    completed: boolean | undefined;
    dismissed: boolean;
}

export function shouldShowSyncOnboarding({
    forceOpen,
    isFocused,
    completed,
    dismissed
}: ShouldShowSyncOnboardingParams): boolean {
    if (forceOpen) {
        return true;
    }
    return isFocused && completed === false && !dismissed;
}
