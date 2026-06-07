import type { SPortfolioLedgerId } from '@safely/sync-storage';
import { portfolioLedgerIdToString } from '@safely/sync-storage';

import type { IPortfolioId } from './I-portfolio';
import type { PortfolioMetaIconEmoji } from './portfolio-meta';
import { allowedPortfolioMetaEmojis } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import { Id } from '../../utils/id';

export class PortfolioIdLedger extends Id implements IPortfolioId {
    public readonly network: PortfolioNetworkType;

    public readonly masterFingerprint: string;

    constructor(serialized: SPortfolioLedgerId) {
        super();

        this.network = serialized.networkType;
        this.masterFingerprint = serialized.masterFingerprint;
    }

    public getFallbackEmoji(): PortfolioMetaIconEmoji {
        const index =
            Buffer.from(this.masterFingerprint, 'hex').readUint32BE() %
            allowedPortfolioMetaEmojis.length;

        return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
    }

    public toString(): string {
        return portfolioLedgerIdToString(this.toJSON());
    }

    public toJSON(): SPortfolioLedgerId {
        return {
            masterFingerprint: this.masterFingerprint,
            networkType: this.network
        };
    }
}

export function toPortfolioIdLedger(serialized: SPortfolioLedgerId): PortfolioIdLedger {
    return new PortfolioIdLedger(serialized);
}
