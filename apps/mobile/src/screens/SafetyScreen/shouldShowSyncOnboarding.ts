interface ShouldShowSyncOnboardingParams {
    forceOpen: boolean;
    completed: boolean | undefined;
    dismissed: boolean;
}

export function shouldShowSyncOnboarding({
    forceOpen,
    completed,
    dismissed
}: ShouldShowSyncOnboardingParams): boolean {
    if (forceOpen) {
        return true;
    }
    return completed === false && !dismissed;
}
