import * as z from 'zod';

import { ASSET_ID_DOMAIN, ASSET_TYPE, IAsset } from './I-asset';
import { Id } from '../../utils/id';

export const sFiatAssetId = z
    .object({
        type: z.literal(ASSET_TYPE.FIAT),
        symbol: z.string()
    })
    .transform(val => new FiatAssetId(val.symbol));
export class FiatAssetId extends Id {
    public readonly type = ASSET_TYPE.FIAT;

    constructor(public readonly symbol: string) {
        super();
    }

    public toString() {
        return this.of(ASSET_ID_DOMAIN, this.type, this.symbol);
    }

    public toJSON(): z.input<typeof sFiatAssetId> {
        return {
            type: this.type,
            symbol: this.symbol
        };
    }
}

export function isFiatAsset(asset: IAsset): asset is FiatAsset {
    return 'type' in asset.id && asset.id.type === ASSET_TYPE.FIAT;
}

export const sFiatAsset = z
    .object({
        id: sFiatAssetId,
        name: z.string()
    })
    .transform(val => new FiatAsset(val.id, val.name));

export class FiatAsset {
    public static create(this: void, { name, symbol }: { name: string; symbol: string }) {
        return new FiatAsset(new FiatAssetId(symbol), name);
    }

    constructor(
        public readonly id: FiatAssetId,
        public readonly name: string
    ) {}

    public toJSON(): z.input<typeof sFiatAsset> {
        return {
            id: this.id.toJSON(),
            name: this.name
        };
    }
}
