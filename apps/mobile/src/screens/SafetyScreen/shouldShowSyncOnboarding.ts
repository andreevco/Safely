interface ShouldShowSyncOnboardingParams {
    forceOpen: boolean;
    completed: boolean | undefined;
}

export function shouldShowSyncOnboarding({
    forceOpen,
    completed
}: ShouldShowSyncOnboardingParams): boolean {
    if (forceOpen) {
        return true;
    }
    return completed === false;
}
