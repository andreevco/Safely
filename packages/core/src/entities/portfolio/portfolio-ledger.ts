import {
    type SLedgerDerivation,
    type SPortfolioLedger,
    sLedgerDerivation,
    sPortfolioLedger
} from '@safely/sync-storage';

import type { ILedgerDerivation } from '../derivation';
import { DerivationChainItemBtcLedger, LedgerDerivation } from '../derivation';
import type { IPortfolioLedger } from './I-portfolio';
import { PortfolioType } from './I-portfolio';
import type { PortfolioIdLedger } from './portfolio-id-ledger';
import { toPortfolioIdLedger } from './portfolio-id-ledger';
import type { PortfolioMeta } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import type { Id } from '../../utils';
import type { ILedgerSessionPort } from '../signer';

export class PortfolioLedger implements IPortfolioLedger {
    public static createSerializedPortfolio(params: {
        masterFingerprint: Buffer;
        networkType: PortfolioNetworkType;
        deviceModel: string;
        accounts: { index: number; xpub: string; name: string }[];
        meta: PortfolioMeta;
    }): SPortfolioLedger {
        const id = toPortfolioIdLedger({
            masterFingerprint: params.masterFingerprint.toString('hex'),
            networkType: params.networkType
        });

        return sPortfolioLedger.toJson({
            type: PortfolioType.LEDGER,
            id: id.toJSON(),
            meta: params.meta,
            deviceModel: params.deviceModel,
            derivations: params.accounts.map(account =>
                sLedgerDerivation.toJson({
                    index: account.index,
                    meta: { name: account.name },
                    chains: { btc: { xpub: account.xpub } }
                })
            )
        });
    }

    public static restore(
        sPortfolio: SPortfolioLedger,
        sessionPort: ILedgerSessionPort
    ): PortfolioLedger {
        return new PortfolioLedger({
            id: toPortfolioIdLedger(sPortfolio.id),
            meta: sPortfolio.meta,
            deviceModel: sPortfolio.deviceModel,
            derivations: self =>
                sPortfolio.derivations.map(d => this.restoreDerivation(self, d, sessionPort))
        });
    }

    private static restoreDerivation(
        portfolioRef: PortfolioLedger,
        sDerivationVal: SLedgerDerivation,
        sessionPort: ILedgerSessionPort
    ): ILedgerDerivation {
        return new LedgerDerivation(
            portfolioRef,
            sDerivationVal.index,
            derivationRef => ({
                btc: new DerivationChainItemBtcLedger({
                    sDerivation: sDerivationVal.chains.btc,
                    masterFingerprint: portfolioRef.masterFingerprint,
                    sessionPort,
                    derivationRef
                })
            }),
            sDerivationVal.meta
        );
    }

    public readonly id: PortfolioIdLedger;

    public readonly meta: PortfolioMeta;

    public readonly deviceModel: string;

    public readonly type = PortfolioType.LEDGER;

    public readonly derivations: ILedgerDerivation[];

    public get masterFingerprint(): Buffer {
        return this.id.masterFingerprint;
    }

    public get networkType(): PortfolioNetworkType {
        return this.id.network;
    }

    constructor(params: {
        id: PortfolioIdLedger;
        meta: PortfolioMeta;
        deviceModel: string;
        derivations: ILedgerDerivation[] | ((self: PortfolioLedger) => ILedgerDerivation[]);
    }) {
        this.id = params.id;
        this.meta = params.meta;
        this.deviceModel = params.deviceModel;
        this.derivations = Array.isArray(params.derivations)
            ? params.derivations
            : params.derivations(this);

        if (!this.derivations.length) {
            throw new Error('Derivations cannot be empty.');
        }
    }

    public getDerivation(id: Id): ILedgerDerivation | undefined {
        return this.derivations.find(d => d.id.isEq(id));
    }

    public getDerivations(): ILedgerDerivation[] {
        return this.derivations;
    }

    public toJSON(): SPortfolioLedger {
        return sPortfolioLedger.toJson({
            type: this.type,
            id: this.id.toJSON(),
            meta: this.meta,
            deviceModel: this.deviceModel,
            derivations: this.derivations.map(d => d.toJSON())
        });
    }

    public jsonArrayId(): string {
        return sPortfolioLedger.jsonArrayId(this.toJSON());
    }
}
