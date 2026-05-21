import { z } from 'zod';

export const sFiatAssetId = z.object({
    symbol: z.string()
});

export type SFiatAssetId = z.infer<typeof sFiatAssetId>;

export const sFiatAsset = z.object({
    id: sFiatAssetId,
    name: z.string()
});

export type SFiatAsset = z.infer<typeof sFiatAsset>;

export const sPreferredFiat = sFiatAsset.nullable();
