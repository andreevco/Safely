import { SyncError } from '../sync-error';
import { u8be } from '../utils/buffer';
import { TLVReader, TLVWriter } from '../utils/tlv';

export enum QRMessageOperation {
    NEW_DEVICE_ONBOARDING = 1,
    RECONNECTION = 2
}

export type QRMessageNewDeviceOnboarding = {
    type: QRMessageOperation.NEW_DEVICE_ONBOARDING;
    ephemeralPub: Buffer;
    ikPub: Buffer;
};

export type QRMessageReconnection = {
    type: QRMessageOperation.RECONNECTION;
    ikPub: Buffer;
};

export type QRMessage = QRMessageNewDeviceOnboarding | QRMessageReconnection;

export class QRMessageCodec {
    public static encode(payload: QRMessage): Buffer {
        const writer = new TLVWriter();
        writer.write(0x01, u8be(payload.type));

        switch (payload.type) {
            case QRMessageOperation.NEW_DEVICE_ONBOARDING:
                writer.write(0x02, payload.ephemeralPub);
                writer.write(0x03, payload.ikPub);
                break;
            case QRMessageOperation.RECONNECTION:
                writer.write(0x02, payload.ikPub);
                break;
            default:
                throw new SyncError('Unsupported operation type in message');
        }

        return writer.concat();
    }

    public static decode(data: Buffer): QRMessage {
        const reader = new TLVReader(data);
        const chunks = reader.readAll();

        const op = chunks.find(d => d.type === 0x01);
        if (!op) {
            throw new SyncError('Missing operation type in message');
        }

        const operation = op.value[0];
        switch (operation) {
            case QRMessageOperation.NEW_DEVICE_ONBOARDING: {
                const ephemeralPubChunk = chunks.find(d => d.type === 0x02);
                const ikPubChunk = chunks.find(d => d.type === 0x03);
                if (!ephemeralPubChunk || !ikPubChunk) {
                    throw new SyncError('Missing fields for new device onboarding message');
                }
                return {
                    type: QRMessageOperation.NEW_DEVICE_ONBOARDING,
                    ephemeralPub: ephemeralPubChunk.value,
                    ikPub: ikPubChunk.value
                };
            }
            case QRMessageOperation.RECONNECTION: {
                const ikPubChunk = chunks.find(d => d.type === 0x02);
                if (!ikPubChunk) {
                    throw new SyncError('Missing IK public key for reconnection message');
                }
                return {
                    type: QRMessageOperation.RECONNECTION,
                    ikPub: ikPubChunk.value
                };
            }
            default:
                throw new SyncError('Unsupported operation type in message');
        }
    }
}
