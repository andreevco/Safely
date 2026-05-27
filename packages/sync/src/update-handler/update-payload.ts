import * as cbor from 'cbor-x';
import { z } from 'zod';

const UpdatePayloadSchema = z.object({
    userStorage: z.instanceof(Uint8Array),
    deviceStorage: z.instanceof(Uint8Array)
});

export type UpdatePayload = {
    userStorage: Buffer;
    deviceStorage: Buffer;
};

export function encodeUpdatePayload(payload: {
    userStorage: Buffer;
    deviceStorage: Buffer;
}): Buffer {
    return cbor.encode({
        userStorage: payload.userStorage,
        deviceStorage: payload.deviceStorage
    });
}

export function decodeUpdatePayload(payload: Buffer): UpdatePayload {
    const parsed = UpdatePayloadSchema.parse(cbor.decode(payload));
    return {
        userStorage: Buffer.from(parsed.userStorage),
        deviceStorage: Buffer.from(parsed.deviceStorage)
    };
}
