import { z } from 'zod';

import type { ApiSigner } from './api-signer';
import type { SnapshotsApi } from './generated';
import type { EncryptedState } from './types';
import type { Logger } from '../logger';
import type { SyncStateRepository } from '../update-handler/sync-state-repository';
import { BufferHexSchema } from '../utils/schemas';
import { SSEStream } from '../utils/sse-stream';

export class SnapshotsSse {
    constructor(
        private readonly syncStateRepository: SyncStateRepository,
        private readonly snapshotsApi: SnapshotsApi,
        private readonly apiSigner: ApiSigner,
        private readonly logger: Logger
    ) {}

    public async subscribeToUpdates(
        onUpdate: (update: EncryptedState) => void | Promise<void>,
        onDisconnect?: (reason?: unknown) => void
    ): Promise<() => void> {
        const url = `${this.snapshotsApi.configuration.basePath}/v1/snapshots/stream`;

        const state = await this.syncStateRepository.getState();
        const headers = {
            'Last-Event-ID': state.snapshotProof.toString('hex')
        };

        const abortController = new AbortController();
        let disconnectNotified = false;
        const notifyDisconnect = (reason?: unknown) => {
            if (disconnectNotified || abortController.signal.aborted) return;
            disconnectNotified = true;
            onDisconnect?.(reason);
        };
        const stream = new SSEStream<EncryptedState>({
            url,
            headers,
            onUpdate: async (update, _) => {
                await onUpdate(update);
            },
            onOpen: () => this.logger.info('/v1/snapshots/stream connected'),
            onError: err => {
                this.logger.error('/v1/snapshots/stream error', err);
            },
            onLog: (level, message, error) => {
                this.logger[level](message, ...(error !== undefined ? [error] : []));
            },
            parsers: {
                snapshot: data => {
                    return {
                        ...snapshotSchema.parse(data)
                    };
                }
            },
            signal: abortController.signal,
            getAuthorizationHeader: async () => {
                return await this.apiSigner.sign('GET', '/v1/snapshots/stream', '');
            }
        });

        void (async () => {
            try {
                for await (const update of stream) {
                    await onUpdate(update.value);
                }
                notifyDisconnect();
            } catch (err) {
                if (abortController.signal.aborted) return;
                this.logger.error('Error in snapshots stream', err);
                notifyDisconnect(err);
            }
        })();

        return () => {
            abortController.abort();
        };
    }
}

const snapshotSchema = z.object({
    kid: BufferHexSchema,
    ciphertext: BufferHexSchema,
    nonce: BufferHexSchema,
    signature: BufferHexSchema,
    snapshotProof: BufferHexSchema
});
