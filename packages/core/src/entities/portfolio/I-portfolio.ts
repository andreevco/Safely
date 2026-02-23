import { Id } from '../../utils/id';
import type { IDerivation } from '../derivation';
import { IPortfolioId } from './portfolio-id';
import { PortfolioMeta } from './portfolio-meta';
import { PortfolioNetworkType } from './portfolio-network-type';

export enum PortfolioType {
    BIP39 = 'BIP39'
}

export interface IPortfolioDerivable {
    id: IPortfolioId;
    meta: PortfolioMeta;
    type: PortfolioType;
    networkType: PortfolioNetworkType;

    derivations: IDerivation[];

    addDerivation(index: number): Promise<void>;
    addNextDerivation(): Promise<void>;
    removeDerivation(index: number): void;
    getDerivation(id: Id): IDerivation | undefined;
    getDerivations(): IDerivation[];
    updateMeta(meta: Partial<PortfolioMeta>): void;
}
