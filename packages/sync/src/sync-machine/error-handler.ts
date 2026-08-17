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
    const code = getErrorCode(error);
    switch (String(code)) {
        case '403001':
        case '409004':
            return new SyncMachineError(
                {
                    type: 'fatal',
                    status: SyncStatus.DEVICE_DELETED
                },
                error
            );
        case '403002':
            return new SyncMachineError(
                {
                    type: 'fatal',
                    status: SyncStatus.SYNC_DATA_NOT_FOUND
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
