import { patch } from '@safely/slottree';

import { sDevicesArchive, sDevicesSyncState } from './schemas';
import { syncedStorageV3 } from '../v3/structure';

const syncedStorageSchema = syncedStorageV3.schema.extend({
    devicesSyncState: sDevicesSyncState,
    devicesArchive: sDevicesArchive
});

export const syncedStorageV4 = {
    version: 4,
    schema: syncedStorageSchema,
    initial: {
        ...syncedStorageV3.initial,
        devicesSyncState: {},
        devicesArchive: {}
    },
    projectUp: patch(syncedStorageV3.schema, syncedStorageSchema, draft =>
        draft.newField('devicesSyncState', {}).newField('devicesArchive', {})
    ),
    projectDown: patch(syncedStorageSchema, syncedStorageV3.schema, draft =>
        draft.deleteField('devicesSyncState').deleteField('devicesArchive')
    )
} as const;
