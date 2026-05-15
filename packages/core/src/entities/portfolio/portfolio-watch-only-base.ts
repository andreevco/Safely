import type { IPortfolioWatchOnly } from './I-portfolio';
import { PortfolioType } from './I-portfolio';
import type { PortfolioMeta } from './portfolio-meta';
import type { VM_TYPE } from '../blockchain';
import type { IPortfolioId } from './portfolio-id-bip39';
import type { PortfolioNetworkType } from './portfolio-network-type';
import type { WalletReadOnly } from '../derivation/wallet-read-only';

export abstract class PortfolioWatchOnlyBase implements IPortfolioWatchOnly {
    public readonly id: IPortfolioId;

    public readonly meta: PortfolioMeta;

    public readonly type = PortfolioType.WATCH_ONLY;

    public abstract readonly vmType: VM_TYPE;

    public abstract readonly wallet: WalletReadOnly;

    public abstract readonly networkType: PortfolioNetworkType;

    protected constructor(params: { id: IPortfolioId; meta: PortfolioMeta }) {
        this.id = params.id;
        this.meta = params.meta;
    }

    public abstract withMeta(meta: Partial<PortfolioMeta>): PortfolioWatchOnlyBase;

    public abstract toJSON(): unknown;
}
