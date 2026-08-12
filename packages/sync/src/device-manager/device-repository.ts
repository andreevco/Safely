import type {
    Device,
    StoredDevice,
    StoredDevices,
    tDevicesLatest,
    tDevicesRest
} from './device-storage-schema';
import {
    addedDeviceToJson,
    devicesFromJson,
    revokedDeviceToJson,
    storedDevicesFromJson
} from './device-storage-schema';
import type { CrdtManager } from '../crdt/crdt-manager';
import { getKID } from '../utils/kid';
export type { Device };

export class DeviceRepository {
    constructor(private readonly manager: CrdtManager<tDevicesLatest, tDevicesRest>) {}

    public onChange(observer: () => void): () => void {
        return this.manager.onChange(observer);
    }

    public async getDevices(): Promise<Device[]> {
        const res = this.manager.getFull();
        const devices = devicesFromJson(res);
        return [...Object.values(devices)].sort((a, b) => a.info.addedAt - b.info.addedAt);
    }

    public async addDevice(device: Device) {
        const kid = getKID(device.info.ikPub);
        await this.manager.transaction(draft => {
            draft.at('devices').set(kid, addedDeviceToJson(device));
        });
    }

    public async activateDevice(device: Device) {
        const kid = getKID(device.info.ikPub);
        await this.manager.transaction(draft => {
            draft.at('devices').entry(kid).unwrap().set('type', 'active');
        });
    }

    public async deleteDevice(ikPub: Buffer): Promise<void> {
        const kid = getKID(ikPub);
        await this.manager.transaction(draft => {
            draft.at('devices').delete(kid);
        });
    }

    public async revokeDevice(ikPub: Buffer, sign: Buffer) {
        const kid = getKID(ikPub);
        await this.manager.transaction(draft => {
            draft.at('devices').set(
                kid,
                revokedDeviceToJson({
                    info: { ikPub },
                    sign
                })
            );
        });
    }

    public async getDevice(kid: string): Promise<Device | undefined> {
        const res = this.manager.getFull();
        const devices = devicesFromJson(res);
        return devices[kid];
    }

    public async getStoredDevice(kid: string) {
        const devices = await this.getStoredDevices();
        return devices[kid];
    }

    public async getStoredDevices(): Promise<StoredDevices> {
        const res = this.manager.getFull();
        return storedDevicesFromJson(res);
    }

    public readStoredDevicesFromSnapshot(snapshot: Buffer): StoredDevices {
        return storedDevicesFromJson(this.manager.readSnapshot(snapshot));
    }

    public async applyUpdate(update: Buffer) {
        await this.manager.applyUpdate(update, 'remote');
    }
}

export type { StoredDevice, StoredDevices };
