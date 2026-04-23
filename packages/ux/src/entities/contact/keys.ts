import { defineQueryKeys, finalKey } from '../../shared';

export const contactKey = defineQueryKeys('contact', {
    accountId: (_id: string | undefined) => {
        return {
            list: finalKey
        };
    }
});
