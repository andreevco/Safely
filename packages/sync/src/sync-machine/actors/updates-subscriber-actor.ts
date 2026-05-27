import type { AnyEventObject } from 'xstate';
import { fromCallback } from 'xstate';

import type { StorageVersion } from '@safely/slottree';

import type { SyncMachineConfig } from '../config';
import { classifyError } from '../error-handler';

export const updatesSubscriberActor = fromCallback(
    (opts: {
        sendBack: (event: AnyEventObject) => void;
        input: SyncMachineConfig<StorageVersion, unknown>;
    }) => {
        const abortController = new AbortController();

        let connected = false;
        const sendConnectionError = (error: unknown) => {
            void classifyError(error)
                .then(classified => {
                    if (!abortController.signal.aborted) {
                        opts.sendBack({ type: 'CONNECTION_ERROR', error: classified });
                    }
                })
                .catch((classificationError: unknown) => {
                    if (!abortController.signal.aborted) {
                        opts.sendBack({ type: 'CONNECTION_ERROR', error: classificationError });
                    }
                });
        };

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
                        opts.sendBack({ type: 'REMOTE_UPDATE', upd });
                    },
                    reason => {
                        if (abortController.signal.aborted) return;
                        if (reason === undefined) {
                            opts.sendBack({ type: 'DISCONNECTED' });
                        } else {
                            sendConnectionError(reason);
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
                sendConnectionError(err);
            }
        })();

        return () => {
            clearTimeout(timeoutId);
            abortController.abort();
        };
    }
);
