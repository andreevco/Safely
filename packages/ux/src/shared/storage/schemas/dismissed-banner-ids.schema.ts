import z from 'zod';

export const sDismissedBannerIds = z.union([z.null(), z.array(z.string())]);
