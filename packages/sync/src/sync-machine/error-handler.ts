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
        const body = (await error.response.json()) as { code: number };
        if (body.code === 403001) {
            return new SyncMachineError({
                type: 'fatal',
                status: SyncStatus.DEVICE_DELETED
            });
        }
    }

    return new SyncMachineError({
        type: 'reconnect'
    });
}

export class SyncMachineError extends Error {
    constructor(public readonly disposition: ErrorDisposition) {
        super(
            `Sync machine error: ${disposition.type}, status: ${disposition.type === 'fatal' ? disposition.status : 'n/a'}`
        );
    }
}
