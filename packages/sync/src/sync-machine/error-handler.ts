import { ResponseError } from '../api/generated';
import { SyncStatus } from '../sync-provider/sync-status';

const DEVICE_DELETED_ERROR_CODES = new Set<number | string>([403001, 409004]);

export type ErrorDisposition =
    | {
          type: 'fatal';
          status: SyncStatus;
      }
    | {
          type: 'reconnect';
      };

export async function classifyError(error: unknown): Promise<SyncMachineError> {
    const code = getErrorCode(error);
    if (code !== undefined && DEVICE_DELETED_ERROR_CODES.has(code)) {
        return new SyncMachineError(
            {
                type: 'fatal',
                status: SyncStatus.DEVICE_DELETED
            },
            error
        );
    }

    return new SyncMachineError(
        {
            type: 'reconnect'
        },
        error
    );
}

function getErrorCode(error: unknown): number | string | undefined {
    if (error instanceof ResponseError) {
        return error.code;
    }

    if (!error || typeof error !== 'object' || !('code' in error)) {
        return undefined;
    }

    const { code } = error as { code?: unknown };
    return typeof code === 'number' || typeof code === 'string' ? code : undefined;
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
