import { patch, projectIdentity, type DeepReadonly } from '@safely/slottree';

import { sDevicesMeta, type SDeviceMeta, type SDevicesMeta } from './schemas';
import { syncedStorageV4 } from '../v4/structure';

const syncedStorageSchema = syncedStorageV4.schema.extend({
    devicesMeta: sDevicesMeta
});

const mapV5PlatformToV4Platform = (v5Platform: SDeviceMeta['platform']) => {
    switch (v5Platform) {
        case 'ios':
            return 'ios';
        case 'android':
            return 'android';

        // v4 platform doesn't support generic platform name, use stub 'ios' for unknown platforms
        default:
            return 'ios';
    }
};

function hasDevices(
    devicesMeta: DeepReadonly<SDevicesMeta>
): devicesMeta is DeepReadonly<NonNullable<SDevicesMeta>> {
    return devicesMeta !== null;
}

export const syncedStorageV5 = {
    version: 5,
    schema: syncedStorageSchema,
    initial: { ...syncedStorageV4.initial },
    projectUp: projectIdentity,
    projectDown: patch(syncedStorageSchema, syncedStorageV4.schema, draft =>
        draft.when(['devicesMeta'], hasDevices, present =>
            present.updateEach(['devicesMeta'], device =>
                device.update(['platform'], mapV5PlatformToV4Platform)
            )
        )
    )
} as const;
