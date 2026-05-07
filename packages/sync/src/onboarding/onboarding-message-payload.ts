import type { AddDeviceOp } from '../crdt/y-manager';
import { DeviceOpSchema, deviceOpToJson } from '../crdt/y-manager';
import { u16be, u8be } from '../utils/buffer';

export type OnboardingMessagePayload = {
    masterKey: Buffer;
    addOp: AddDeviceOp;
};

export function encodeOnboardingMessagePayload(message: OnboardingMessagePayload): Buffer {
    const addOpJson = Buffer.from(deviceOpToJson(message.addOp), 'utf-8');
    return Buffer.concat([
        u8be(0x01), // version
        u16be(message.masterKey.length),
        message.masterKey,
        u16be(addOpJson.length),
        addOpJson
    ]);
}

export function decodeOnboardingMessagePayload(data: Buffer): OnboardingMessagePayload {
    let offset = 0;
    const version = data.readUInt8(offset);
    offset += 1;
    if (version !== 0x01) {
        throw new Error(`Unsupported onboarding message version: ${version}`);
    }

    const masterKeyLength = data.readUInt16BE(offset);
    offset += 2;
    const masterKey = data.slice(offset, offset + masterKeyLength);
    offset += masterKeyLength;

    const addOpJsonLength = data.readUInt16BE(offset);
    offset += 2;
    const addOpJson = data.slice(offset, offset + addOpJsonLength).toString('utf-8');
    const op = DeviceOpSchema.parse(JSON.parse(addOpJson));

    if (op.type !== 'add') {
        throw new Error(`Unexpected onboarding message format`);
    }

    return { masterKey, addOp: op as AddDeviceOp };
}
