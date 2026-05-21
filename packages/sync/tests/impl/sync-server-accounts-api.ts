import type { SyncServer } from './sync-server';
import type {
    AddDeviceToAccountRequest,
    CreateAccountRequest,
    OnboardingMessage,
    PostOnboardingMessageRequest,
    RemoveDeviceFromAccountRequest
} from '../../src/api/generated';

export class SyncServerAccountsApi {
    constructor(
        private readonly server: SyncServer,
        private readonly getRequesterIk: () => string | Promise<string>
    ) {}

    public async addDeviceToAccount(request: AddDeviceToAccountRequest): Promise<void> {
        this.server.addDeviceToAccount(request, await this.getRequesterIk());
    }

    public async confirmOnboarding(): Promise<void> {
        this.server.confirmOnboarding(await this.getRequesterIk());
    }

    public async createAccount(request: CreateAccountRequest): Promise<void> {
        this.server.createAccount(request);
    }

    public async getOnboardingMessage(request?: {
        signal?: AbortSignal;
    }): Promise<OnboardingMessage> {
        const requesterIk = await this.getRequesterIk();
        try {
            return this.server.getOnboardingMessage(requesterIk);
        } catch {
            await this.server.waitForOnboardingMessage(requesterIk, {
                signal: request?.signal,
                timeoutMs: 100
            });
            return this.server.getOnboardingMessage(requesterIk);
        }
    }

    public async postOnboardingMessage(request: PostOnboardingMessageRequest): Promise<void> {
        this.server.postOnboardingMessage(request, await this.getRequesterIk());
    }

    public async removeDeviceFromAccount(request: RemoveDeviceFromAccountRequest): Promise<void> {
        this.server.removeDeviceFromAccount(request, await this.getRequesterIk());
    }
}
