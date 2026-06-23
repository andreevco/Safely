import { describe, expect, it } from 'vitest';

import { QRMessageCodec, QRMessageOperation } from '../src/onboarding/onboarding-codec';
import { u8be } from '../src/utils/buffer';
import { TLVWriter } from '../src/utils/tlv';

describe('QRMessageCodec', () => {
    it('encodes and decodes new-device onboarding devices storage version', () => {
        const message = QRMessageCodec.decode(
            QRMessageCodec.encode({
                type: QRMessageOperation.NEW_DEVICE_ONBOARDING,
                ephemeralPub: Buffer.from('ephemeral'),
                ikPub: Buffer.from('ik'),
                storageVersion: 2,
                devicesStorageVersion: 3
            })
        );

        expect(message).toEqual({
            type: QRMessageOperation.NEW_DEVICE_ONBOARDING,
            ephemeralPub: Buffer.from('ephemeral'),
            ikPub: Buffer.from('ik'),
            storageVersion: 2,
            devicesStorageVersion: 3
        });
    });

    it('decodes old new-device onboarding QR data with devices storage version v1', () => {
        const writer = new TLVWriter();
        writer.write(0x01, u8be(QRMessageOperation.NEW_DEVICE_ONBOARDING));
        writer.write(0x02, Buffer.from('ephemeral'));
        writer.write(0x03, Buffer.from('ik'));
        writer.write(0x04, u8be(2));

        const message = QRMessageCodec.decode(writer.concat());

        expect(message).toMatchObject({
            type: QRMessageOperation.NEW_DEVICE_ONBOARDING,
            storageVersion: 2,
            devicesStorageVersion: 1
        });
    });

    it('encodes and decodes reconnection devices storage version', () => {
        const message = QRMessageCodec.decode(
            QRMessageCodec.encode({
                type: QRMessageOperation.RECONNECTION,
                ikPub: Buffer.from('ik'),
                storageVersion: 2,
                devicesStorageVersion: 3
            })
        );

        expect(message).toEqual({
            type: QRMessageOperation.RECONNECTION,
            ikPub: Buffer.from('ik'),
            storageVersion: 2,
            devicesStorageVersion: 3
        });
    });

    it('decodes old reconnection QR data with devices storage version v1', () => {
        const writer = new TLVWriter();
        writer.write(0x01, u8be(QRMessageOperation.RECONNECTION));
        writer.write(0x02, Buffer.from('ik'));
        writer.write(0x04, u8be(2));

        const message = QRMessageCodec.decode(writer.concat());

        expect(message).toEqual({
            type: QRMessageOperation.RECONNECTION,
            ikPub: Buffer.from('ik'),
            storageVersion: 2,
            devicesStorageVersion: 1
        });
    });
});
