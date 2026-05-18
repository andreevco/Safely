import type { z } from 'zod';

import {
    sPortfolioBip39Source,
    sPortfolioType,
    sPortfolioWatchOnlySource
} from '@safely/sync-storage';

import type { Id } from '../../utils/id';
import type { VM_TYPE } from '../blockchain';
import type { IDerivation, WalletReadOnly } from '../derivation';
import type { IPortfolioId } from './portfolio-id-bip39';
import type { PortfolioMeta } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';

export const PortfolioType = sPortfolioType.enum;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PortfolioType = z.infer<typeof sPortfolioType>;

export const Bip39Source = sPortfolioBip39Source.enum;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Bip39Source = z.infer<typeof sPortfolioBip39Source>;

export const WatchOnlySource = sPortfolioWatchOnlySource.enum;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type WatchOnlySource = z.infer<typeof sPortfolioWatchOnlySource>;

export interface IPortfolioBase {
    id: IPortfolioId;
    meta: PortfolioMeta;
    type: PortfolioType;
    networkType: PortfolioNetworkType;
    toJSON(): unknown;
}

export interface IPortfolioDerivable extends IPortfolioBase {
    type: typeof PortfolioType.BIP39;
    secretRevealedStatus: PortfolioSecretRevealedStatus;

    derivations: IDerivation[];

    withAddedDerivation(index: number): Promise<IPortfolioDerivable>;
    withAddedNextDerivation(): Promise<IPortfolioDerivable>;
    withoutDerivation(index: number): IPortfolioDerivable;
    getDerivation(id: Id): IDerivation | undefined;
    getDerivations(): IDerivation[];
}

export interface IPortfolioWatchOnly extends IPortfolioBase {
    type: typeof PortfolioType.WATCH_ONLY;
    vmType: VM_TYPE;
    wallet: WalletReadOnly;
}

export type PortfolioSecretRevealedStatus = {
    revealedAt: Date;
    revealedFromDevice: string;
} | null;
