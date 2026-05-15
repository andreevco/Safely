import type { ZodType } from 'zod';

import type { OnboardingConnector } from './connector';
import { EagerOnboardingConnector } from './eager-onboarding-connector';
import type { ISyncAccount } from '../account/I-sync-account';

type OnboardingSession<S extends Record<string, ZodType>> = {
    data: Buffer;
    waitForCompletion: (signal: AbortSignal) => Promise<ISyncAccount<S>>;
};

export class SingleActiveOnboardingCoordinator<S extends Record<string, ZodType>> {
    private activeConnector: { token: object; connector: OnboardingConnector<S> } | null = null;
    private activeConnectorPromise: {
        token: object;
        promise: Promise<OnboardingConnector<S>>;
    } | null = null;

    public async getConnector(
        createSession: () => Promise<OnboardingSession<S>>
    ): Promise<OnboardingConnector<S>> {
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
