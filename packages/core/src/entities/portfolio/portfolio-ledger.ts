import { type SDerivation, type SPortfolioLedger, sPortfolioLedger } from '@safely/sync-storage';

import type { IDerivation } from '../derivation';
import { Derivation, DerivationChainItemBtcLedger } from '../derivation';
import type { IPortfolioLedger } from './I-portfolio';
import { PortfolioType } from './I-portfolio';
import type { PortfolioIdLedger } from './portfolio-id-ledger';
import { toPortfolioIdLedger } from './portfolio-id-ledger';
import type { PortfolioMeta } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import type { Id } from '../../utils';
import type { ILedgerSessionPort } from '../signer';

export class PortfolioLedger implements IPortfolioLedger {
    public static create(params: {
        masterFingerprint: string;
        networkType: PortfolioNetworkType;
        deviceModel: string;
        accounts: { index: number; xpub: string }[];
        meta: PortfolioMeta;
        sessionPort?: ILedgerSessionPort;
    }): PortfolioLedger {
        const id = toPortfolioIdLedger({
            masterFingerprint: params.masterFingerprint,
            networkType: params.networkType
        });

        return new PortfolioLedger({
            id,
            meta: params.meta,
            deviceModel: params.deviceModel,
            derivations: self =>
                params.accounts.map(
                    account =>
                        new Derivation(self, account.index, derivationRef => ({
                            btc: new DerivationChainItemBtcLedger({
                                sDerivation: { xpub: account.xpub },
                                masterFingerprint: params.masterFingerprint,
                                sessionPort: params.sessionPort,
                                derivationRef
                            })
                        }))
                )
        });
    }

    public static restore(
        sPortfolio: SPortfolioLedger,
        sessionPort?: ILedgerSessionPort
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
        sDerivationVal: SDerivation,
        sessionPort?: ILedgerSessionPort
    ): IDerivation {
        return new Derivation(
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
            sDerivationVal.name
        );
    }

    public readonly id: PortfolioIdLedger;

    public readonly meta: PortfolioMeta;

    public readonly deviceModel: string;

    public readonly type = PortfolioType.LEDGER;

    public readonly derivations: IDerivation[];

    public get masterFingerprint(): string {
        return this.id.masterFingerprint;
    }

    public get networkType(): PortfolioNetworkType {
        return this.id.network;
    }

    constructor(params: {
        id: PortfolioIdLedger;
        meta: PortfolioMeta;
        deviceModel: string;
        derivations: IDerivation[] | ((self: PortfolioLedger) => IDerivation[]);
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

    public getDerivation(id: Id): IDerivation | undefined {
        return this.derivations.find(d => d.id.isEq(id));
    }

    public getDerivations(): IDerivation[] {
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
