import { IPortfolioWatchOnly, PortfolioType, WatchOnlySource } from './I-portfolio';
import { PortfolioIdWatchOnly } from './portfolio-id-watch-only';
import { PortfolioMeta } from './portfolio-meta';
import { SPortfolioWatchOnlyIn, SPortfolioWatchOnlyOut } from './portfolio.stored';
import { assertUnreachable } from '../../utils';
import { btcNetworkByPortfolioNetworkType, BtcWalletType, VMType } from '../blockchain';
import { BtcWalletId } from '../derivation/btc/btc-wallet-id';
import { BtcWalletReadOnly } from '../derivation/btc/I-btc-wallet';
import type { WalletReadOnly } from '../derivation/wallet-read-only';

export class PortfolioWatchOnly implements IPortfolioWatchOnly {
    public static restorePortfolio(sPortfolio: SPortfolioWatchOnlyOut): PortfolioWatchOnly {
        switch (sPortfolio.id.vmType) {
            case VMType.BTC: {
                const wallet: BtcWalletReadOnly = {
                    vmType: VMType.BTC,
                    id: new BtcWalletId(sPortfolio.id, sPortfolio.address),
                    type: BtcWalletType.NATIVE_SEGWIT,
                    address: sPortfolio.address,
                    network: btcNetworkByPortfolioNetworkType(sPortfolio.id.network),
                    xpub: sPortfolio.xpub
                };

                return new PortfolioWatchOnly({
                    id: sPortfolio.id,
                    meta: sPortfolio.meta,
                    vmType: VMType.BTC,
                    source: sPortfolio.id.source,
                    wallet
                });
            }
            default:
                assertUnreachable(sPortfolio.id.vmType);
        }
    }

    public readonly id: PortfolioIdWatchOnly;

    public meta: PortfolioMeta;

    public readonly type = PortfolioType.WATCH_ONLY;

    public readonly vmType: VMType;

    public readonly source: WatchOnlySource;

    public readonly wallet: WalletReadOnly;

    public get networkType() {
        return this.id.network;
    }

    constructor(params: {
        id: PortfolioIdWatchOnly;
        meta: PortfolioMeta;
        vmType: VMType;
        source: WatchOnlySource;
        wallet: WalletReadOnly;
    }) {
        this.id = params.id;
        this.meta = params.meta;
        this.vmType = params.vmType;
        this.source = params.source;
        this.wallet = params.wallet;
    }

    public updateMeta(meta: Partial<PortfolioMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public toJSON(): SPortfolioWatchOnlyIn {
        switch (this.wallet.vmType) {
            case VMType.BTC:
                return {
                    id: this.id.toJSON(),
                    meta: this.meta,
                    type: this.type,
                    address: this.wallet.address,
                    xpub: this.wallet.xpub
                };
            default:
                assertUnreachable(this.wallet.vmType);
        }
    }
}
