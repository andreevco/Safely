import { Device, DeviceRepository } from './device-repository';
import { DeviceOp, YManager } from '../crdt/y-manager';
import { ed25519_sign, ed25519_verify } from '../crypto/ed25519';
import { generateKID } from '../crypto/generate-kid';
import { KeyRepository } from '../crypto/key-repository';
import { SyncError } from '../sync-error';
import { u64be, utf8 } from '../utils/buffer';

export class DeviceManagementService {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly yManager: YManager,
        private readonly keyRepository: KeyRepository
    ) {}

    public async getDevices(): Promise<Device[]> {
        return await this.deviceRepository.getDevices();
    }

    public async addDevice(device: Device): Promise<void> {
        const devices = await this.getDevices();
        if (devices.some(d => d.ikPub.equals(device.ikPub))) {
            throw new Error('Device with the same ikPub already exists.');
        }

        const ts = Date.now();
        const sig = await this.signDeviceOp({
            type: 'add',
            ikPub: device.ikPub,
            ts
        });

        const op: DeviceOp = {
            type: 'add',
            ikPub: device.ikPub,
            ts,
            sig
        };
        await this.yManager.addDeviceOp(op);
        await this.deviceRepository.setDevices([...devices, device]);
    }

    public async revokeDevice(ikPub: Buffer): Promise<void> {
        const devices = await this.getDevices();
        if (!devices.some(d => d.ikPub.equals(ikPub))) {
            throw new Error('Device not found.');
        }

        const ts = Date.now();
        const sig = await this.signDeviceOp({
            type: 'revoke',
            ikPub,
            ts
        });

        const op: DeviceOp = {
            type: 'revoke',
            ikPub,
            ts,
            sig
        };
        await this.yManager.addDeviceOp(op);
        await this.deviceRepository.setDevices(devices.filter(d => !d.ikPub.equals(ikPub)));
    }

    public async verifyDeviceOpAndApply(op: DeviceOp): Promise<void> {
        await this.verifyDeviceOpSignature(op);

        const devices = await this.getDevices();
        if (op.type === 'add') {
            if (devices.some(d => d.ikPub.equals(op.ikPub))) {
                throw new Error('Device with the same ikPub already exists.');
            }
            await this.deviceRepository.setDevices([...devices, { ikPub: op.ikPub }]);
        } else if (op.type === 'revoke') {
            if (!devices.some(d => d.ikPub.equals(op.ikPub))) {
                throw new Error('Device not found.');
            }
            await this.deviceRepository.setDevices(devices.filter(d => !d.ikPub.equals(op.ikPub)));
        }
    }

    // TODO: consider moving this method to a separate class, e.g. DeviceVerifier
    // TODO: optimize this method by caching the KID to ikPub mapping
    public async verifyDeviceIKSig(opts: {
        kid: Buffer;
        sig: Buffer;
        data: Buffer;
    }): Promise<boolean> {
        for (const device of await this.getDevices()) {
            const kid = generateKID(device.ikPub);
            if (kid.equals(opts.kid)) {
                return ed25519_verify(opts.sig, opts.data, device.ikPub);
            }
        }
        throw new UnknownDeviceError('Device with the given KID not found.');
    }

    public async verifyDeviceOpSignature(op: DeviceOp): Promise<void> {
        const dataToVerify = Buffer.concat([
            utf8(`safely/sync/v1/device/${op.type}`),
            Buffer.from([0x00]),
            op.ikPub,
            u64be(op.ts)
        ]);

        const dmkPub = await this.keyRepository.getDMKPub();
        const isValid = ed25519_verify(dataToVerify, op.sig, dmkPub);
        if (!isValid) {
            throw new InvalidDMKSignatureError('Invalid device operation signature.');
        }
    }

    private async signDeviceOp(opts: {
        type: 'add' | 'revoke';
        ikPub: Buffer;
        ts: number;
    }): Promise<Buffer> {
        const dataToSign = Buffer.concat([
            utf8(`safely/sync/v1/device/${opts.type}`),
            Buffer.from([0x00]),
            opts.ikPub,
            u64be(opts.ts)
        ]);

        const dmkKey = await this.keyRepository.getDMKPrv();
        return ed25519_sign(dataToSign, dmkKey);
    }
}

export class DeviceManagerError extends SyncError {}
export class InvalidDMKSignatureError extends DeviceManagerError {}
export class UnknownDeviceError extends DeviceManagerError {}
