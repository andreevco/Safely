import { patch } from '@safely/slottree';

import { sDevicesSyncState } from './schemas';
import { syncedStorageV3 } from '../v3/structure';

const syncedStorageSchema = syncedStorageV3.schema.extend({
    devicesSyncState: sDevicesSyncState
});

export const syncedStorageV4 = {
    version: 4,
    schema: syncedStorageSchema,
    initial: {
        ...syncedStorageV3.initial,
        devicesSyncState: {}
    },
    projectUp: patch(syncedStorageV3.schema, syncedStorageSchema, draft =>
        draft.newField('devicesSyncState', {})
    ),
    projectDown: patch(syncedStorageSchema, syncedStorageV3.schema, draft =>
        draft.deleteField('devicesSyncState')
    )
} as const;
