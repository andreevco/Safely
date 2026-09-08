import type { StorageVersion } from '@safely/slottree';

import type { OnboardedAccount, OnboardingConnector } from './connector';
import { EagerOnboardingConnector } from './eager-onboarding-connector';

type OnboardingSession<Latest extends StorageVersion> = {
    data: Buffer;
    waitForCompletion: (signal: AbortSignal) => Promise<OnboardedAccount<Latest>>;
};

export class SingleActiveOnboardingCoordinator<Latest extends StorageVersion> {
    private activeConnector: { token: object; connector: OnboardingConnector<Latest> } | null =
        null;
    private activeConnectorPromise: {
        token: object;
        promise: Promise<OnboardingConnector<Latest>>;
    } | null = null;

    public async getConnector(
        createSession: () => Promise<OnboardingSession<Latest>>
    ): Promise<OnboardingConnector<Latest>> {
        if (this.activeConnector) {
            return this.activeConnector.connector;
        }

        if (this.activeConnectorPromise) {
            return await this.activeConnectorPromise.promise;
        }

        const token = {};
        const promise = createSession()
            .then(session => {
                const connector = new EagerOnboardingConnector(
                    session.data,
                    session.waitForCompletion,
                    () => {
                        this.clearConnector(token);
                    }
                );

                if (this.activeConnectorPromise?.token === token) {
                    this.activeConnector = { token, connector };
                    this.activeConnectorPromise = null;
                }

                return connector;
            })
            .catch(error => {
                this.clearConnector(token);
                throw error;
            });
        this.activeConnectorPromise = { token, promise };
        return await promise;
    }

    private clearConnector(token: object): void {
        if (this.activeConnectorPromise?.token === token) {
            this.activeConnectorPromise = null;
        }

        if (this.activeConnector?.token === token) {
            this.activeConnector = null;
        }
    }
}
