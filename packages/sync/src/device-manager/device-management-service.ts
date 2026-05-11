import { DeviceRepository } from './device-repository';
import { Device, StoredDevice } from './device-storage-schema';
import { ed25519_verify } from '../crypto/ed25519';
import { DmkSignerService } from '../crypto/service/dmk-signer-service';
import { DmkVerifierService } from '../crypto/service/dmk-verifier-service';
import { IkService } from '../crypto/service/ik-service';
import { SyncError } from '../sync-error';
import { u64be, utf8 } from '../utils/buffer';
import { getKID } from '../utils/kid';

export class DeviceManagementService {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly ikService: IkService,
        private readonly dmkVerifierService: DmkVerifierService
    ) {}

    public async getDevices(): Promise<Device[]> {
        return await this.deviceRepository.getDevices();
    }

    public async addDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<void> {
        await this.deviceRepository.addDevice(await this.makeDevice(ikPub, dmkSignerService));
    }

    public async revokeDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<void> {
        const devices = await this.getDevices();
        if (!devices.some(d => d.info.ikPub.equals(ikPub))) {
            throw new Error('Device not found.');
        }

        const sign = await this.signRevokedDevice({
            ikPub,
            dmkSignerService
        });

        await this.deviceRepository.revokeDevice(ikPub, sign);
    }

    public async mergeDeviceStorage(update: Buffer): Promise<void> {
        const localDevices = await this.deviceRepository.getStoredDevices();
        const remoteDevices = this.deviceRepository.readStoredDevicesFromSnapshot(update);

        for (const [kid, remoteDevice] of Object.entries(remoteDevices)) {
            const localDevice = localDevices[kid];
            if (localDevice && storedDeviceEquals(localDevice, remoteDevice)) {
                continue;
            }

            await this.verifyStoredDevice(remoteDevice);
        }

        await this.deviceRepository.applyUpdate(update);
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

        for (const device of devices) {
            const kid = Buffer.from(getKID(device.info.ikPub), 'hex');
            if (kid.equals(opts.kid)) {
                return ed25519_verify(opts.sig, opts.data, device.info.ikPub);
            }
        }
        throw new UnknownDeviceError(
            `Device with the given KID ${opts.kid.toString('hex')} not found.`
        );
    }

    public async verifyStoredDevice(device: StoredDevice): Promise<void> {
        const isValid = await this.dmkVerifierService.verify(
            device.sign,
            this.getStoredDeviceSignData(device)
        );

        if (!isValid) {
            throw new InvalidDMKSignatureError('Invalid device signature.');
        }
    }

    public async makeDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<Device> {
        const devices = await this.getDevices();
        if (devices.some(d => d.info.ikPub.equals(ikPub))) {
            throw new Error('Device with the same ikPub already exists.');
        }
        const addedAt = Date.now();
        const sign = await this.signDevice({
            ikPub,
            addedAt,
            dmkSignerService
        });
        return {
            info: {
                ikPub,
                addedAt
            },
            sign
        };
    }

    private async signDevice(opts: {
        ikPub: Buffer;
        addedAt: number;
        dmkSignerService: DmkSignerService;
    }): Promise<Buffer> {
        const dataToSign = Buffer.concat([
            utf8(`safely/sync/v1/device/add`),
            Buffer.from([0x00]),
            opts.ikPub,
            u64be(opts.addedAt)
        ]);

        return await opts.dmkSignerService.sign(dataToSign);
    }

    private async signRevokedDevice(opts: {
        ikPub: Buffer;
        dmkSignerService: DmkSignerService;
    }): Promise<Buffer> {
        const dataToSign = Buffer.concat([
            utf8(`safely/sync/v1/device/revoke`),
            Buffer.from([0x00]),
            opts.ikPub
        ]);

        return await opts.dmkSignerService.sign(dataToSign);
    }

    private getStoredDeviceSignData(device: StoredDevice): Buffer {
        if (device.type === 'active') {
            return Buffer.concat([
                utf8(`safely/sync/v1/device/add`),
                Buffer.from([0x00]),
                device.info.ikPub,
                u64be(device.info.addedAt)
            ]);
        }

        return Buffer.concat([
            utf8(`safely/sync/v1/device/revoke`),
            Buffer.from([0x00]),
            device.info.ikPub
        ]);
    }
}

function storedDeviceEquals(left: StoredDevice, right: StoredDevice): boolean {
    if (left.type !== right.type || !left.info.ikPub.equals(right.info.ikPub)) {
        return false;
    }

    if (!left.sign.equals(right.sign)) {
        return false;
    }

    if (left.type === 'revoked' || right.type === 'revoked') {
        return true;
    }

    return left.info.addedAt === right.info.addedAt;
}

export class DeviceManagerError extends SyncError {}
export class InvalidDMKSignatureError extends DeviceManagerError {}
export class UnknownDeviceError extends DeviceManagerError {}
