import { z } from 'zod';

import { ApiSigner } from './api-signer';
import { SnapshotsApi } from './generated';
import { EncryptedState } from './types';
import { SyncStateRepository } from '../update-handler/sync-state-repository';
import { BufferHexSchema } from '../utils/schemas';
import { SSEStream } from '../utils/sse-stream';

export class SnapshotsSse {
    constructor(
        private readonly syncStateRepository: SyncStateRepository,
        private readonly snapshotsApi: SnapshotsApi,
        private readonly apiSigner: ApiSigner
    ) {}

    public async subscribeToUpdates(
        onUpdate: (update: EncryptedState) => void | Promise<void>,
        onDisconnect?: (reason?: unknown) => void
    ): Promise<() => void> {
        const url = `${this.snapshotsApi.configuration.basePath}/v1/snapshots/stream`;
        const authHeader = await this.apiSigner.sign('GET', url, '');

        const state = await this.syncStateRepository.getState();
        const headers = {
            Authorization: authHeader,
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
            onOpen: () => console.log('/v1/snapshots/stream connected'),
            onError: err => {
                console.error('/v1/snapshots/stream error', err);
            },
            parsers: {
                snapshot: data => {
                    return {
                        kid: Buffer.from([]), // TODO: kid
                        ...snapshotSchema.parse(data)
                    };
                }
            },
            signal: abortController.signal
        });

        void (async () => {
            try {
                for await (const update of stream) {
                    await onUpdate(update.value);
                }
                notifyDisconnect();
            } catch (err) {
                if (abortController.signal.aborted) return;
                console.error('Error in snapshots stream', err);
                notifyDisconnect(err);
            }
        })();

        return () => {
            abortController.abort();
        };
    }
}

const snapshotSchema = z.object({
    ciphertext: BufferHexSchema,
    nonce: BufferHexSchema,
    signature: BufferHexSchema,
    snapshotProof: BufferHexSchema
});
