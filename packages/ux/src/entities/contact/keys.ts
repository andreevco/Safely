import { defineQueryKeys, finalKey } from '../../shared/query-core/query-key-factory';

export const contactKey = defineQueryKeys('contact', {
    accountId: (_id: string | undefined) => {
        return {
            list: finalKey
        };
    }
});
