import type { AnyEventObject } from 'xstate';
import { fromCallback } from 'xstate';

import { StorageVersion } from '@safely/slottree';

import type { SyncMachineConfig } from '../config';

export const updatesSubscriberActor = fromCallback(
    (opts: {
        sendBack: (event: AnyEventObject) => void;
        input: SyncMachineConfig<StorageVersion, unknown>;
    }) => {
        const abortController = new AbortController();

        let connected = false;

        const timeoutId = setTimeout(() => {
            if (!connected) {
                opts.input.logger.warn('Updates subscriber: timeout exceeded, aborting connection');
                abortController.abort();
                opts.sendBack({ type: 'DISCONNECTED' });
            }
        }, 5000);

        (async () => {
            try {
                const unsubscribe = await opts.input.snapshotsSse.subscribeToUpdates(
                    upd => {
                        if (abortController.signal.aborted) {
                            return;
                        }
                        opts.input.logger.info(
                            'Received remote update via SSE, proof:',
                            upd.snapshotProof.toString('hex').slice(0, 16) + '...'
                        );
                        opts.sendBack({ type: 'REMOTE_UPDATE', upd });
                    },
                    reason => {
                        if (abortController.signal.aborted) return;
                        if (reason instanceof Error) {
                            opts.sendBack({
                                type: 'CONNECTION_ERROR',
                                error: reason.message ?? String(reason)
                            });
                        } else {
                            opts.sendBack({ type: 'DISCONNECTED' });
                        }
                    }
                );

                abortController.signal.addEventListener('abort', () => {
                    unsubscribe();
                });

                connected = true;
                clearTimeout(timeoutId);
                opts.sendBack({ type: 'CONNECTED' });
            } catch (err) {
                if (abortController.signal.aborted) return;

                opts.input.logger.error('Failed to subscribe to updates', err);
                opts.sendBack({
                    type: 'CONNECTION_ERROR',
                    error: err instanceof Error ? err : String(err)
                });
            }
        })();

        return () => {
            clearTimeout(timeoutId);
            abortController.abort();
        };
    }
);
