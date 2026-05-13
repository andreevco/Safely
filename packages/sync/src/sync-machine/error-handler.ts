import { ResponseError } from '../api/generated';
import { SyncStatus } from '../sync-provider/sync-status';

export type ErrorDisposition =
    | {
          type: 'fatal';
          status: SyncStatus;
      }
    | {
          type: 'reconnect';
      };

export async function classifyError(error: unknown): Promise<SyncMachineError> {
    if (error instanceof ResponseError) {
        if (error.code === 403001) {
            return new SyncMachineError(
                {
                    type: 'fatal',
                    status: SyncStatus.DEVICE_DELETED
                },
                error
            );
        }
    }

    return new SyncMachineError(
        {
            type: 'reconnect'
        },
        error
    );
}

export class SyncMachineError extends Error {
    constructor(
        public readonly disposition: ErrorDisposition,
        public override readonly cause?: unknown
    ) {
        super(
            `Sync machine error: ${disposition.type}, status: ${disposition.type === 'fatal' ? disposition.status : 'n/a'}`,
            { cause }
        );
    }
}
