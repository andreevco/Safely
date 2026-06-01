import type {
    SPortfolioBip39Id,
    SPortfolioBip39IdImported,
    SPortfolioBip39IdMasterKeyDerived
} from '@safely/sync-storage';
import { portfolioBip39IdToString } from '@safely/sync-storage';

import { Bip39Source } from './I-portfolio';
import type { PortfolioMetaIconEmoji } from './portfolio-meta';
import { allowedPortfolioMetaEmojis } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import { assertUnreachable, sha256Prefix } from '../../utils';
import { Id } from '../../utils/id';
import type { IMnemonicAccessor } from '../mnemonic';

export interface IPortfolioId extends Id {
    network: PortfolioNetworkType;
}

export class PortfolioIdBip39MasterKeyDerived extends Id implements IPortfolioId {
    public readonly source = Bip39Source.MASTER_KEY_DERIVED;

    public readonly network: PortfolioNetworkType;

    private readonly derivationIndex: number;

    constructor(serialized: Omit<SPortfolioBip39IdMasterKeyDerived, 'source'>) {
        super();

        this.network = serialized.networkType;
        this.derivationIndex = serialized.derivationIndex;
    }

    public getFallbackEmoji(): PortfolioMetaIconEmoji {
        const index = this.derivationIndex % allowedPortfolioMetaEmojis.length;

        return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
    }

    public toString(): string {
        return portfolioBip39IdToString(this.toJSON());
    }

    public toJSON(): SPortfolioBip39IdMasterKeyDerived {
        return {
            source: this.source,
            derivationIndex: this.derivationIndex,
            networkType: this.network
        };
    }
}

export class PortfolioIdBip39Imported extends Id implements IPortfolioId {
    public static async create(
        mnemonicAccessor: IMnemonicAccessor,
        network: PortfolioNetworkType
    ): Promise<PortfolioIdBip39Imported> {
        const mnemonicHash = sha256Prefix(
            `safely/v1/portfolio-id/imported/${mnemonicAccessor.value.join(' ').toLowerCase()}`,
            16
        );
        return new PortfolioIdBip39Imported({
            mnemonicHash,
            networkType: network
        });
    }

    public readonly source = Bip39Source.IMPORTED;

    public readonly network: PortfolioNetworkType;

    private readonly mnemonicHash: string;

    constructor(serialized: Omit<SPortfolioBip39IdImported, 'source'>) {
        super();

        this.network = serialized.networkType;
        this.mnemonicHash = serialized.mnemonicHash;
    }

    public getFallbackEmoji(): PortfolioMetaIconEmoji {
        const index =
            Buffer.from(this.mnemonicHash, 'hex').readUint32BE() %
            allowedPortfolioMetaEmojis.length;

        return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
    }

    public toString(): string {
        return portfolioBip39IdToString(this.toJSON());
    }

    public toJSON(): SPortfolioBip39IdImported {
        return {
            source: this.source,
            mnemonicHash: this.mnemonicHash,
            networkType: this.network
        };
    }
}

export type PortfolioIdBip39 = PortfolioIdBip39MasterKeyDerived | PortfolioIdBip39Imported;
export function toPortfolioIdBip39(serialized: SPortfolioBip39Id) {
    switch (serialized.source) {
        case Bip39Source.MASTER_KEY_DERIVED:
            return new PortfolioIdBip39MasterKeyDerived(serialized);
        case Bip39Source.IMPORTED:
            return new PortfolioIdBip39Imported(serialized);
        default:
            assertUnreachable(serialized);
    }
}
