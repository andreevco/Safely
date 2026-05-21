import type { SFiatAsset, SFiatAssetId } from '@safely/sync-storage';

import type { IAsset } from './I-asset';
import { ASSET_ID_DOMAIN, ASSET_TYPE } from './I-asset';
import { Id } from '../../utils/id';

export class FiatAssetId extends Id {
    public static restore(sFiatAssetId: SFiatAssetId) {
        return new FiatAssetId(sFiatAssetId.symbol);
    }

    public readonly type = ASSET_TYPE.FIAT;

    constructor(public readonly symbol: string) {
        super();
    }

    public toString() {
        return this.of(ASSET_ID_DOMAIN, this.type, this.symbol);
    }

    public toJSON(): SFiatAssetId {
        return {
            symbol: this.symbol
        };
    }
}

export function isFiatAsset(asset: IAsset): asset is FiatAsset {
    return 'type' in asset.id && asset.id.type === ASSET_TYPE.FIAT;
}

export class FiatAsset {
    public static create(this: void, { name, symbol }: { name: string; symbol: string }) {
        return new FiatAsset(new FiatAssetId(symbol), name);
    }

    public static restore(sFiatAsset: SFiatAsset) {
        return new FiatAsset(FiatAssetId.restore(sFiatAsset.id), sFiatAsset.name);
    }

    constructor(
        public readonly id: FiatAssetId,
        public readonly name: string
    ) {}

    public toJSON(): SFiatAsset {
        return {
            id: this.id.toJSON(),
            name: this.name
        };
    }
}
