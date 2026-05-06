import { defineQueryKeys, finalKey } from '../../shared';

export const dismissedBannersKeys = defineQueryKeys('dismissedBanners', {
    ids: finalKey
});
