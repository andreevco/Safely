import { defineQueryKeys, finalKey } from '@safely/ux';

export const notificationsKeys = defineQueryKeys('notifications', {
    permissions: finalKey
});
