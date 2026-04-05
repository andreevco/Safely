import { IPortfolioWatchOnly, PortfolioType, WatchOnlySource } from './I-portfolio';
import { PortfolioIdWatchOnly } from './portfolio-id-watch-only';
import { PortfolioMeta } from './portfolio-meta';
import { SPortfolioWatchOnlyIn, SPortfolioWatchOnlyOut } from './portfolio.stored';
import { BtcNetwork, btcNetworkByPortfolioNetworkType, BtcWalletType } from '../blockchain';
import { BtcWalletId } from '../derivation/btc/btc-wallet-id';
import { BtcWalletReadOnly } from '../derivation/btc/I-btc-wallet';

export class PortfolioWatchOnly implements IPortfolioWatchOnly {
    public static restorePortfolio(sPortfolio: SPortfolioWatchOnlyOut): PortfolioWatchOnly {
        return new PortfolioWatchOnly({
            id: sPortfolio.id,
            meta: sPortfolio.meta,
            source: sPortfolio.id.source,
            address: sPortfolio.address,
            xpub: sPortfolio.xpub ?? '',
            network: btcNetworkByPortfolioNetworkType(sPortfolio.id.network)
        });
    }

    public readonly id: PortfolioIdWatchOnly;

    public meta: PortfolioMeta;

    public readonly type = PortfolioType.WATCH_ONLY;

    public readonly source: WatchOnlySource;

    public readonly btcWallet: BtcWalletReadOnly;

    public get networkType() {
        return this.id.network;
    }

    constructor(params: {
        id: PortfolioIdWatchOnly;
        meta: PortfolioMeta;
        source: WatchOnlySource;
        address: string;
        xpub: string;
        network: BtcNetwork;
    }) {
        this.id = params.id;
        this.meta = params.meta;
        this.source = params.source;

        this.btcWallet = {
            id: new BtcWalletId(params.id, params.address),
            type: BtcWalletType.NATIVE_SEGWIT,
            address: params.address,
            network: params.network,
            xpub: params.xpub
        };
    }

    public getBtcWallet(): BtcWalletReadOnly {
        return this.btcWallet;
    }

    public updateMeta(meta: Partial<PortfolioMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public toJSON(): SPortfolioWatchOnlyIn {
        return {
            id: this.id.toJSON(),
            meta: this.meta,
            type: this.type,
            address: this.btcWallet.address,
            xpub: this.btcWallet.xpub || undefined
        };
    }
}
