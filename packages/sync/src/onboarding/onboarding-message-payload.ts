import { u16be, u8be } from '../utils/buffer';

export type OnboardingMessagePayload = {
    masterKey: Buffer;
};

export function encodeOnboardingMessagePayload(message: OnboardingMessagePayload): Buffer {
    return Buffer.concat([
        u8be(0x01), // version
        u16be(message.masterKey.length),
        message.masterKey
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

    return { masterKey };
}
