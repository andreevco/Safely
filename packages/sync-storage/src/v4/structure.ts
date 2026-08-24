import { patch, projectIdentity, type DeepReadonly } from '@safely/slottree';

import { sDevicesMeta, type SDeviceMeta, type SDevicesMeta } from './schemas';
import { syncedStorageV3 } from '../v3/structure';

const syncedStorageSchema = syncedStorageV3.schema.extend({
    devicesMeta: sDevicesMeta
});

const mapV4PlatformTov3Platform = (v4Platform: SDeviceMeta['platform']) => {
    switch (v4Platform) {
        case 'ios':
            return 'ios';
        case 'android':
            return 'android';

        // v3 platform doesn't support generic platform name, use stub 'ios' for unknown platforms
        default:
            return 'ios';
    }
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
                device.update(['platform'], mapV4PlatformTov3Platform)
            )
        )
    )
} as const;
