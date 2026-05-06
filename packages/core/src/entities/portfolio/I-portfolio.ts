import type { Id } from '../../utils/id';
import type { VMType } from '../blockchain';
import type { IDerivation, WalletReadOnly } from '../derivation';
import type { IPortfolioId } from './portfolio-id';
import type { PortfolioMeta } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import type { PortfolioSecretRevealedStatus } from './portfolio-secret-revealed-status';

export enum PortfolioType {
    BIP39 = 'BIP39',
    WATCH_ONLY = 'WATCH_ONLY'
}

export enum WatchOnlySource {
    ADDRESS = 'ADDRESS',
    XPUB = 'XPUB'
}

export interface IPortfolioBase {
    id: IPortfolioId;
    meta: PortfolioMeta;
    type: PortfolioType;
    networkType: PortfolioNetworkType;
    updateMeta(meta: Partial<PortfolioMeta>): void;
    toJSON(): unknown;
}

export interface IPortfolioDerivable extends IPortfolioBase {
    type: PortfolioType.BIP39;
    secretRevealedStatus: PortfolioSecretRevealedStatus;

    derivations: IDerivation[];

    addDerivation(index: number): Promise<void>;
    addNextDerivation(): Promise<void>;
    removeDerivation(index: number): void;
    getDerivation(id: Id): IDerivation | undefined;
    getDerivations(): IDerivation[];
    recordSecretReveal(fromDevice: string): void;
}

export interface IPortfolioWatchOnly extends IPortfolioBase {
    type: PortfolioType.WATCH_ONLY;
    vmType: VMType;
    source: WatchOnlySource;
    wallet: WalletReadOnly;
}
