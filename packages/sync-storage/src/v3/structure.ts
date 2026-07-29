import { patch } from '@safely/slottree';

import { sAmountDisplay } from './schemas';
import { syncedStorageV2 } from '../v2/structure';

const syncedStorageSchema = syncedStorageV2.schema.extend({
    amountDisplay: sAmountDisplay
});

export const syncedStorageV3 = {
    version: 3,
    schema: syncedStorageSchema,
    initial: {
        ...syncedStorageV2.initial,
        amountDisplay: {}
    },
    projectUp: patch(syncedStorageV2.schema, syncedStorageSchema, draft =>
        draft.newField('amountDisplay', {})
    ),
    projectDown: patch(syncedStorageSchema, syncedStorageV2.schema, draft =>
        draft.deleteField('amountDisplay')
    )
} as const;
