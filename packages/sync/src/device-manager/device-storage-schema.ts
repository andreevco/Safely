import { z } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { hex } from '../utils/buffer';

export type Device = {
    info: {
        ikPub: Buffer;
        addedAt: number;
    };
    sign: Buffer;
};

export type RevokedDevice = {
    info: {
        ikPub: Buffer;
    };
    sign: Buffer;
};

export type StoredActiveDevice = Device & {
    type: 'active';
};

export type StoredAddedDevice = Device & {
    type: 'added';
};

export type StoredRevokedDevice = RevokedDevice & {
    type: 'revoked';
};

export type StoredDevice = StoredActiveDevice | StoredAddedDevice | StoredRevokedDevice;
export type StoredDevices = Record<string, StoredDevice>;
export type Devices = Record<string, Device>;

export type DevicesJson = z.infer<typeof sDevices>;
export type DeviceJson = z.infer<typeof sStoredActiveDevice>;

const sStoredActiveDevice = z.object({
    type: z.literal('active'),
    info: z.object({
        ikPub: z.string(),
        addedAt: z.number()
    }),
    sign: z.string()
});

const sAddedDevice = sStoredActiveDevice.extend({
    type: z.literal('added')
});

const sStoredRevokedDevice = z.object({
    type: z.literal('revoked'),
    info: z.object({
        ikPub: z.string()
    }),
    sign: z.string()
});

const sStoredDevice = z.union([sStoredActiveDevice, sAddedDevice, sStoredRevokedDevice]);

export const sDevices = z.object({
    devices: z.record(z.string(), sStoredDevice)
});

export const DevicesV1 = {
    version: 1,
    schema: sDevices,
    initial: {
        devices: {}
    },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

export type tDevicesV1 = typeof DevicesV1;
export type tDevicesRest = typeof hNil;

export const DevicesVersions = defineVersionHList(hCons(DevicesV1, hNil));
export type tDevicesLatest = (typeof DevicesVersions)['head'];

export function devicesToJson(devices: Devices) {
    const json: DevicesJson = {
        devices: {}
    };

    for (const [kid, device] of Object.entries(devices)) {
        json.devices[kid] = deviceToJson(device);
    }

    return sDevices.parse(json);
}

export function deviceToJson(device: Device) {
    return {
        type: 'active',
        info: {
            ikPub: device.info.ikPub.toString('hex'),
            addedAt: device.info.addedAt
        },
        sign: device.sign.toString('hex')
    } as const;
}

export function addedDeviceToJson(device: Device) {
    return {
        type: 'added',
        info: {
            ikPub: device.info.ikPub.toString('hex'),
            addedAt: device.info.addedAt
        },
        sign: device.sign.toString('hex')
    } as const;
}

export function deviceFromJson(input: unknown): Device {
    const parsed = sStoredActiveDevice.parse(input);
    return {
        info: {
            ikPub: hex(parsed.info.ikPub),
            addedAt: parsed.info.addedAt
        },
        sign: hex(parsed.sign)
    };
}

export function revokedDeviceToJson(device: RevokedDevice) {
    return {
        type: 'revoked',
        info: {
            ikPub: device.info.ikPub.toString('hex')
        },
        sign: device.sign.toString('hex')
    } as const;
}

export function devicesFromJson(input: unknown): Devices {
    const storedDevices = storedDevicesFromJson(input);
    const devices: Devices = {};

    for (const [kid, device] of Object.entries(storedDevices)) {
        if (device.type === 'active') {
            const { type: _type, ...activeDevice } = device;
            devices[kid] = activeDevice;
        }
    }

    return devices;
}

export function storedDevicesFromJson(input: unknown): StoredDevices {
    const parsed = sDevices.parse(input);

    const devices: StoredDevices = {};

    for (const [kid, deviceJson] of Object.entries(parsed.devices)) {
        if (deviceJson.type === 'active' || deviceJson.type === 'added') {
            devices[kid] = {
                type: deviceJson.type,
                info: {
                    ikPub: hex(deviceJson.info.ikPub),
                    addedAt: deviceJson.info.addedAt
                },
                sign: hex(deviceJson.sign)
            };
            continue;
        }

        devices[kid] = {
            type: 'revoked',
            info: {
                ikPub: hex(deviceJson.info.ikPub)
            },
            sign: hex(deviceJson.sign)
        };
    }

    return devices;
}
