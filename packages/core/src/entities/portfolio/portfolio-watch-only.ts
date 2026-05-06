import type { WatchOnlySource } from './I-portfolio';
import type { PortfolioIdWatchOnly } from './portfolio-id-watch-only';
import type { PortfolioMeta } from './portfolio-meta';
import { PortfolioWatchOnlyBase } from './portfolio-watch-only-base';
import type { SPortfolioBtcWatchOnlyIn, SPortfolioBtcWatchOnlyOut } from './portfolio.stored';
import { btcNetworkByPortfolioNetworkType, BtcWalletType, VMType } from '../blockchain';
import { BtcWalletId } from '../derivation/btc/btc-wallet-id';
import type { BtcWalletReadOnly } from '../derivation/btc/I-btc-wallet';

export class PortfolioWatchOnlyBtc extends PortfolioWatchOnlyBase {
    public static restorePortfolio(sPortfolio: SPortfolioBtcWatchOnlyOut): PortfolioWatchOnlyBtc {
        const wallet: BtcWalletReadOnly = {
            id: new BtcWalletId(sPortfolio.id, sPortfolio.address),
            type: BtcWalletType.NATIVE_SEGWIT,
            address: sPortfolio.address,
            network: btcNetworkByPortfolioNetworkType(sPortfolio.id.network),
            xpub: sPortfolio.xpub
        };

        return new PortfolioWatchOnlyBtc({
            id: sPortfolio.id,
            meta: sPortfolio.meta,
            source: sPortfolio.id.source,
            wallet
        });
    }

    public readonly vmType = VMType.BTC;

    public readonly wallet: BtcWalletReadOnly;

    constructor(params: {
        id: PortfolioIdWatchOnly;
        meta: PortfolioMeta;
        source: WatchOnlySource;
        wallet: BtcWalletReadOnly;
    }) {
        super({ id: params.id, meta: params.meta, source: params.source });
        this.wallet = params.wallet;
    }

    public toJSON(): SPortfolioBtcWatchOnlyIn {
        return {
            id: this.id.toJSON(),
            meta: this.meta,
            type: this.type,
            address: this.wallet.address,
            xpub: this.wallet.xpub
        };
    }
}

export type PortfolioWatchOnly = PortfolioWatchOnlyBtc;
