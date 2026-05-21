import { z } from 'zod';

const UpdatePayloadSchema = z.object({
    userStorage: z.string(),
    deviceStorage: z.string()
});

export type UpdatePayload = z.infer<typeof UpdatePayloadSchema>;

export function encodeUpdatePayload(payload: {
    userStorage: Buffer;
    deviceStorage: Buffer;
}): Buffer {
    return Buffer.from(
        JSON.stringify({
            userStorage: payload.userStorage.toString('utf8'),
            deviceStorage: payload.deviceStorage.toString('utf8')
        }),
        'utf8'
    );
}

export function decodeUpdatePayload(payload: Buffer): UpdatePayload {
    return UpdatePayloadSchema.parse(JSON.parse(payload.toString('utf8')));
}
