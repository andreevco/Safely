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
    storageVersion: number;
};

export type QRMessageReconnection = {
    type: QRMessageOperation.RECONNECTION;
    ikPub: Buffer;
    storageVersion: number;
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
                writer.write(0x04, u8be(payload.storageVersion));
                break;
            case QRMessageOperation.RECONNECTION:
                writer.write(0x02, payload.ikPub);
                writer.write(0x04, u8be(payload.storageVersion));
                break;
            default:
                throw new UnsupportedQRCodeOperationError();
        }

        return writer.concat();
    }

    public static decode(data: Buffer): QRMessage {
        const reader = new TLVReader(data);
        const chunks = reader.readAll();

        const op = chunks.find(d => d.type === 0x01);
        if (!op) {
            throw new CorruptedQRCodeOperationError();
        }

        const operation = QRMessageCodec.decodeOperation(op.value[0]);
        switch (operation) {
            case QRMessageOperation.NEW_DEVICE_ONBOARDING: {
                const ephemeralPubChunk = chunks.find(d => d.type === 0x02);
                const ikPubChunk = chunks.find(d => d.type === 0x03);
                const storageVersionChunk = chunks.find(d => d.type === 0x04);
                if (!ephemeralPubChunk || !ikPubChunk || !storageVersionChunk) {
                    throw new CorruptedQRCodeOperationError();
                }
                return {
                    type: QRMessageOperation.NEW_DEVICE_ONBOARDING,
                    ephemeralPub: ephemeralPubChunk.value,
                    ikPub: ikPubChunk.value,
                    storageVersion: storageVersionChunk.value[0]
                };
            }
            case QRMessageOperation.RECONNECTION: {
                const ikPubChunk = chunks.find(d => d.type === 0x02);
                const storageVersionChunk = chunks.find(d => d.type === 0x04);
                if (!ikPubChunk || !storageVersionChunk) {
                    throw new CorruptedQRCodeOperationError();
                }
                return {
                    type: QRMessageOperation.RECONNECTION,
                    ikPub: ikPubChunk.value,
                    storageVersion: storageVersionChunk.value[0]
                };
            }
            default:
                throw new UnsupportedQRCodeOperationError();
        }
    }

    private static decodeOperation(value: number): QRMessageOperation {
        switch (value) {
            case 1:
                return QRMessageOperation.NEW_DEVICE_ONBOARDING;
            case 2:
                return QRMessageOperation.RECONNECTION;
            default:
                throw new UnsupportedQRCodeOperationError();
        }
    }
}

export class UnsupportedQRCodeOperationError extends SyncError {}
export class CorruptedQRCodeOperationError extends SyncError {}
