import type { IPortfolioWatchOnly, WatchOnlySource } from './I-portfolio';
import { PortfolioType } from './I-portfolio';
import type { PortfolioIdWatchOnly } from './portfolio-id-watch-only';
import type { PortfolioMeta } from './portfolio-meta';
import type { VMType } from '../blockchain';
import type { WalletReadOnly } from '../derivation/wallet-read-only';

export abstract class PortfolioWatchOnlyBase implements IPortfolioWatchOnly {
    public readonly id: PortfolioIdWatchOnly;

    public meta: PortfolioMeta;

    public readonly type = PortfolioType.WATCH_ONLY;

    public abstract readonly vmType: VMType;

    public readonly source: WatchOnlySource;

    public abstract readonly wallet: WalletReadOnly;

    public get networkType() {
        return this.id.network;
    }

    constructor(params: {
        id: PortfolioIdWatchOnly;
        meta: PortfolioMeta;
        source: WatchOnlySource;
    }) {
        this.id = params.id;
        this.meta = params.meta;
        this.source = params.source;
    }

    public updateMeta(meta: Partial<PortfolioMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public abstract toJSON(): unknown;
}
