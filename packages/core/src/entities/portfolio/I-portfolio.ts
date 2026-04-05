import { Id } from '../../utils/id';
import type { IDerivation } from '../derivation';
import { IPortfolioId } from './portfolio-id';
import { PortfolioMeta } from './portfolio-meta';
import { PortfolioNetworkType } from './portfolio-network-type';
import { PortfolioSecretRevealedStatus } from './portfolio-secret-revealed-status';
import type { BtcWalletReadOnly } from '../derivation/btc/I-btc-wallet';

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
    getBtcWallet(): BtcWalletReadOnly;
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
    source: WatchOnlySource;
    btcWallet: BtcWalletReadOnly;
}
