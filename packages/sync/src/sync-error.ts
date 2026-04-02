export class SyncError extends Error {}

export class OnboardingAbortedError extends SyncError {
    constructor() {
        super('Onboarding aborted');
    }
}
