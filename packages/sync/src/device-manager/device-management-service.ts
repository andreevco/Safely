import type { DeviceRepository } from './device-repository';
import type { Device, StoredDevice } from './device-storage-schema';
import { ed25519_verify } from '../crypto/ed25519';
import type { DmkSignerService } from '../crypto/service/dmk-signer-service';
import type { DmkVerifierService } from '../crypto/service/dmk-verifier-service';
import type { IkService } from '../crypto/service/ik-service';
import type { Logger } from '../logger';
import { SyncFlowLogger } from '../logger';
import { SyncError } from '../sync-error';
import { u64be, utf8 } from '../utils/buffer';
import { getKID } from '../utils/kid';
import { waitForChange } from '../utils/wait-for-change';

export class DeviceManagementService {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly ikService: IkService,
        private readonly dmkVerifierService: DmkVerifierService,
        private readonly logger: Logger
    ) {}

    public onChange(observer: () => void): () => void {
        return this.deviceRepository.onChange(observer);
    }

    public async getDevices(): Promise<Device[]> {
        return await this.deviceRepository.getDevices();
    }

    public async isDeviceVisible(ikPub: Buffer): Promise<boolean> {
        const devices = await this.getDevices();
        return devices.some(d => d.info.ikPub.equals(ikPub));
    }

    public async waitUntilDeviceVisible(
        ikPub: Buffer,
        opts: {
            timeoutMs?: number;
            timeoutError?: () => Error;
        } = {}
    ): Promise<void> {
        const timeoutError =
            opts.timeoutError ?? (() => new DeviceManagerError('Device did not become visible'));

        await waitForChange({
            subscribe: observer => this.onChange(observer),
            predicate: () => this.isDeviceVisible(ikPub),
            timeoutMs: opts.timeoutMs ?? 5000,
            timeoutError
        });
    }

    public async addDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<void> {
        const flow = this.startFlow('device_management.add_device', {
            ikPub: ikPub.toString('hex')
        });

        try {
            const device = await this.makeDevice(ikPub, dmkSignerService);
            await this.deviceRepository.addDevice(device);
            flow.logEnd('added');
        } catch (error) {
            flow.logFail(error, 'failed');
            throw error;
        }
    }

    public async activate(): Promise<void> {
        const device = await this.getThisStoredDevice();
        if (!device || device.type !== 'added') {
            return;
        }

        await this.deviceRepository.activateDevice({
            info: device.info,
            sign: device.sign
        });
        this.logger.info('Device activated', { ikPub: device.info.ikPub.toString('hex') });
    }

    public async isThisDeviceActive(): Promise<boolean> {
        const device = await this.getThisStoredDevice();
        return device?.type === 'active';
    }

    public async isThisDeviceRevoked(): Promise<boolean> {
        const device = await this.getThisStoredDevice();
        return device?.type === 'revoked';
    }

    public async assertDeviceCanReconnect(ikPub: Buffer): Promise<void> {
        const device = await this.deviceRepository.getStoredDevice(getKID(ikPub));
        if (!device) {
            throw new ReconnectFromAnotherAccountError(
                `Device with the given IK ${ikPub.toString('hex')} does not belong to this account.`
            );
        }

        if (device.type !== 'revoked') {
            throw new DeviceAlreadyExistsError(
                `Device with the given IK ${ikPub.toString('hex')} already exists.`
            );
        }
    }

    public async revokeDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<void> {
        const flow = this.startFlow('device_management.revoke_device', {
            ikPub: ikPub.toString('hex')
        });

        try {
            const devices = await this.getDevices();
            if (!devices.some(d => d.info.ikPub.equals(ikPub))) {
                throw new Error('Device not found.');
            }

            const sign = await this.signRevokedDevice({
                ikPub,
                dmkSignerService
            });

            await this.deviceRepository.revokeDevice(ikPub, sign);
            flow.logEnd('revoked');
        } catch (error) {
            flow.logFail(error, 'failed');
            throw error;
        }
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
        const isValid = this.dmkVerifierService.verify(
            device.sign,
            this.getStoredDeviceSignData(device)
        );

        if (!isValid) {
            throw new InvalidDMKSignatureError('Invalid device signature.');
        }
    }

    public async makeDevice(ikPub: Buffer, dmkSignerService: DmkSignerService): Promise<Device> {
        const devices = await this.deviceRepository.getStoredDevices();
        if (Object.values(devices).some(d => d.type !== 'revoked' && d.info.ikPub.equals(ikPub))) {
            throw new DeviceAlreadyExistsError('Device with the same ikPub already exists.');
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

    private async getThisStoredDevice(): Promise<StoredDevice | undefined> {
        const ikPub = this.ikService.getPub();
        return await this.deviceRepository.getStoredDevice(getKID(ikPub));
    }

    private getStoredDeviceSignData(device: StoredDevice): Buffer {
        if (device.type === 'active' || device.type === 'added') {
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

    private startFlow(flow: string, fields: Record<string, unknown> = {}): SyncFlowLogger {
        return SyncFlowLogger.start(this.logger, flow, fields);
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
export class DeviceAlreadyExistsError extends DeviceManagerError {}
export class ReconnectFromAnotherAccountError extends DeviceManagerError {}
