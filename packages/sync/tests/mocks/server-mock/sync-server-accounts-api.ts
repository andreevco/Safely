import type { SyncServer } from './sync-server';
import type {
    AddDeviceToAccountRequest,
    CreateAccountRequest,
    OnboardingMessage,
    PostOnboardingMessageRequest,
    RemoveDeviceFromAccountRequest
} from '../../../src/api/generated';

export class SyncServerAccountsApi {
    constructor(
        private readonly server: SyncServer,
        private readonly requesterIk: string
    ) {}

    public async addDeviceToAccount(request: AddDeviceToAccountRequest): Promise<void> {
        this.server.addDeviceToAccount(request, this.requesterIk);
    }

    public async confirmOnboarding(): Promise<void> {
        this.server.confirmOnboarding(this.requesterIk);
    }

    public async createAccount(request: CreateAccountRequest): Promise<void> {
        this.server.createAccount(request);
    }

    public async getOnboardingMessage(request?: {
        signal?: AbortSignal;
    }): Promise<OnboardingMessage> {
        try {
            return this.server.getOnboardingMessage(this.requesterIk);
        } catch {
            await this.server.waitForOnboardingMessage(this.requesterIk, {
                signal: request?.signal,
                timeoutMs: 100
            });
            return this.server.getOnboardingMessage(this.requesterIk);
        }
    }

    public async postOnboardingMessage(request: PostOnboardingMessageRequest): Promise<void> {
        this.server.postOnboardingMessage(request, this.requesterIk);
    }

    public async removeDeviceFromAccount(request: RemoveDeviceFromAccountRequest): Promise<void> {
        this.server.removeDeviceFromAccount(request, this.requesterIk);
    }
}
