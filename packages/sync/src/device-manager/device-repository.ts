import { z } from 'zod';

import type { IStorage } from '../I-storage';
import { BufferHexSchema } from '../utils/schemas';

export class DeviceRepository {
    constructor(private readonly storage: IStorage) {}

    public async getKnownOpsAmount(): Promise<number> {
        const amountStr = await this.storage.getItem('known_ops_amount');
        return amountStr ? parseInt(amountStr) : 0;
    }

    public async setKnownOpsAmount(amount: number): Promise<void> {
        await this.storage.setItem('known_ops_amount', amount.toString());
    }

    public async getDevices(): Promise<Device[]> {
        const devicesJson = await this.storage.getItem('devices');
        if (!devicesJson) {
            return [];
        }
        const devices = DeviceSchema.array().parse(JSON.parse(devicesJson));
        devices.sort((a, b) => a.addedAt - b.addedAt);
        return devices;
    }

    public async setDevices(devices: Device[]): Promise<void> {
        const devicesJson = JSON.stringify(devices.map(deviceToJson));
        await this.storage.setItem('devices', devicesJson);
    }
}

export type Device = {
    ikPub: Buffer;
    addedAt: number;
};

function deviceToJson(device: Device) {
    return {
        ikPub: device.ikPub.toString('hex'),
        addedAt: device.addedAt
    };
}

export const DeviceSchema = z.object({
    ikPub: BufferHexSchema,
    addedAt: z.number()
});
