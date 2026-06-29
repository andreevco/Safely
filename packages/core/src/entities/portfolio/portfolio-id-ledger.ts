import type { SPortfolioLedgerId } from '@safely/sync-storage';
import { portfolioLedgerIdToString } from '@safely/sync-storage';

import type { IPortfolioId } from './I-portfolio';
import type { PortfolioMetaIconEmoji } from './portfolio-meta';
import { allowedPortfolioMetaEmojis } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import { Id } from '../../utils/id';

export class PortfolioIdLedger extends Id implements IPortfolioId {
    public readonly network: PortfolioNetworkType;

    public readonly masterFingerprint: Buffer;

    constructor(serialized: SPortfolioLedgerId) {
        super();

        this.network = serialized.networkType;
        this.masterFingerprint = Buffer.from(serialized.masterFingerprint, 'hex');
    }

    public getFallbackEmoji(): PortfolioMetaIconEmoji {
        const index = this.masterFingerprint.readUint32BE() % allowedPortfolioMetaEmojis.length;

        return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
    }

    public toString(): string {
        return portfolioLedgerIdToString(this.toJSON());
    }

    public toJSON(): SPortfolioLedgerId {
        return {
            masterFingerprint: this.masterFingerprint.toString('hex'),
            networkType: this.network
        };
    }
}

export function toPortfolioIdLedger(serialized: SPortfolioLedgerId): PortfolioIdLedger {
    return new PortfolioIdLedger(serialized);
}
