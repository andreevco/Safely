export class SyncError extends Error {}

export class OnboardingAbortedError extends SyncError {
    constructor() {
        super('Onboarding aborted');
    }
}

export class AccountAlreadyExistsError extends SyncError {
    constructor() {
        super('Account already exists');
    }
}
