import { patch, projectIdentity, type DeepReadonly } from '@safely/slottree';

import { sDevicesMeta, type SDeviceMeta, type SDevicesMeta } from './schemas';
import type { SDeviceMeta as SDeviceMetaV3 } from '../v3/schemas';
import { syncedStorageV3 } from '../v3/structure';

const syncedStorageSchema = syncedStorageV3.schema.extend({
    devicesMeta: sDevicesMeta
});

// dropping a desktop device from the v3 projection would hide it from the device list of older apps
const v3Platform: Record<SDeviceMeta['platform'], SDeviceMetaV3['platform']> = {
    ios: 'ios',
    android: 'android',
    macos: 'ios',
    windows: 'android'
};

function hasDevices(
    devicesMeta: DeepReadonly<SDevicesMeta>
): devicesMeta is DeepReadonly<NonNullable<SDevicesMeta>> {
    return devicesMeta !== null;
}

export const syncedStorageV4 = {
    version: 4,
    schema: syncedStorageSchema,
    initial: { ...syncedStorageV3.initial },
    projectUp: projectIdentity,
    projectDown: patch(syncedStorageSchema, syncedStorageV3.schema, draft =>
        draft.when(['devicesMeta'], hasDevices, present =>
            present.updateEach(['devicesMeta'], device =>
                device.update(['platform'], platform => v3Platform[platform])
            )
        )
    )
} as const;
