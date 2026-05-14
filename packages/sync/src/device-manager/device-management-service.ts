import type { Device, DeviceRepository } from './device-repository';
import type { AddDeviceOp, DeviceOp, YManager } from '../crdt/y-manager';
import { ed25519_verify } from '../crypto/ed25519';
import { generateKID } from '../crypto/generate-kid';
import type { DmkSignerService } from '../crypto/service/dmk-signer-service';
import type { DmkVerifierService } from '../crypto/service/dmk-verifier-service';
import type { IkService } from '../crypto/service/ik-service';
import { SyncError } from '../sync-error';
import { u64be, utf8 } from '../utils/buffer';

export class DeviceManagementService {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly yManager: YManager,
        private readonly ikService: IkService,
        private readonly dmkVerifierService: DmkVerifierService
    ) {}

    public async getDevices(): Promise<Device[]> {
        return await this.deviceRepository.getDevices();
    }

    public async addDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<void> {
        const devices = await this.getDevices();
        if (devices.some(d => d.ikPub.equals(ikPub))) {
            throw new Error('Device with the same ikPub already exists.');
        }
        const now = Date.now();

        await this.performOperation({
            type: 'add',
            ikPub,
            dmkSignerService,
            time: now
        });
        const device = { ikPub, addedAt: now };
        await this.deviceRepository.setDevices([...devices, device]);
    }

    public async revokeDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<void> {
        const devices = await this.getDevices();
        if (!devices.some(d => d.ikPub.equals(ikPub))) {
            throw new Error('Device not found.');
        }

        await this.performOperation({
            type: 'revoke',
            ikPub,
            dmkSignerService
        });

        await this.deviceRepository.setDevices(devices.filter(d => !d.ikPub.equals(ikPub)));
    }

    private async performOperation(opts: {
        type: 'add' | 'revoke';
        ikPub: Buffer;
        dmkSignerService: DmkSignerService;
        time?: number;
    }) {
        const ts = opts.time ?? Date.now();
        const kid = this.ikService.getKID();
        const sig = await this.signDeviceOp({
            ...opts,
            ts
        });

        const op: DeviceOp = {
            type: opts.type,
            ikPub: opts.ikPub,
            ts,
            kid,
            sig
        };
        await this.yManager.addDeviceOp(op);
    }

    /**
     * In onboarding flow, primary device creates add operation and sends it to the new device, which then applies it.
     * @param ikPub
     * @param dmkSignerService
     */
    public async makeAddOp(
        ikPub: Buffer,
        dmkSignerService: DmkSignerService
    ): Promise<AddDeviceOp> {
        const ts = Date.now();
        const kid = this.ikService.getKID();
        const sig = await this.signDeviceOp({
            type: 'add',
            ikPub,
            dmkSignerService,
            ts
        });

        return {
            type: 'add',
            ikPub,
            ts,
            kid,
            sig
        };
    }

    public async verifyDeviceOpAndApply(op: DeviceOp): Promise<void> {
        const devices = await this.getDevices();

        if (devices.length !== 0) {
            await this.verifyKidExists(op.kid);
        }

        await this.verifyDeviceOpSignature(op);

        if (op.type === 'add') {
            if (devices.some(d => d.ikPub.equals(op.ikPub))) {
                throw new Error('Device with the same ikPub already exists.');
            }
            await this.deviceRepository.setDevices([
                ...devices,
                { ikPub: op.ikPub, addedAt: op.ts }
            ]);
        } else if (op.type === 'revoke') {
            if (!devices.some(d => d.ikPub.equals(op.ikPub))) {
                throw new Error('Device not found.');
            }
            await this.deviceRepository.setDevices(devices.filter(d => !d.ikPub.equals(op.ikPub)));
        }
    }

    public async verifyDeviceIKSig(opts: {
        kid: Buffer;
        sig: Buffer;
        data: Buffer;
    }): Promise<boolean> {
        const devices = await this.getDevices();
        if (devices.length === 0) {
            return true; // first sync
        }

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
            op.kid,
            u64be(op.ts)
        ]);

        const isValid = this.dmkVerifierService.verify(op.sig, dataToVerify);
        if (!isValid) {
            throw new InvalidDMKSignatureError('Invalid device operation signature.');
        }
    }

    private async verifyKidExists(kid: Buffer): Promise<void> {
        const devices = await this.getDevices();
        if (!devices.some(d => generateKID(d.ikPub).equals(kid))) {
            throw new UnknownDeviceError('Device with the given KID not found.');
        }
    }

    private async signDeviceOp(opts: {
        type: 'add' | 'revoke';
        ikPub: Buffer;
        ts: number;
        dmkSignerService: DmkSignerService;
    }): Promise<Buffer> {
        const selfKID = this.ikService.getKID();
        const dataToSign = Buffer.concat([
            utf8(`safely/sync/v1/device/${opts.type}`),
            Buffer.from([0x00]),
            opts.ikPub,
            selfKID,
            u64be(opts.ts)
        ]);

        return await opts.dmkSignerService.sign(dataToSign);
    }
}

export class DeviceManagerError extends SyncError {}
export class InvalidDMKSignatureError extends DeviceManagerError {}
export class UnknownDeviceError extends DeviceManagerError {}
