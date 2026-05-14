import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';

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
import { assertUnreachable } from '../../utils';
import { xorFold16 } from '../../utils/crypto';
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
        const mnemonicHash = xorFold16(
            Buffer.from(
                // TODO мб проще?
                hmac(
                    sha512,
                    Buffer.from('SECRET_BASED_PORTFOLIO_ID'),
                    Buffer.from(mnemonicAccessor.value.join(' ').toLowerCase())
                )
            )
        );
        return new PortfolioIdBip39Imported({
            seedHash: mnemonicHash.toString('hex'),
            networkType: network
        });
    }

    public readonly source = Bip39Source.IMPORTED;

    public readonly network: PortfolioNetworkType;

    private readonly seedHash: string;

    constructor(serialized: Omit<SPortfolioBip39IdImported, 'source'>) {
        super();

        this.network = serialized.networkType;
        this.seedHash = serialized.seedHash;
    }

    public getFallbackEmoji(): PortfolioMetaIconEmoji {
        const index =
            Buffer.from(this.seedHash, 'hex').readUint32BE() % allowedPortfolioMetaEmojis.length;

        return { type: 'emoji', value: allowedPortfolioMetaEmojis[index] };
    }

    public toString(): string {
        return portfolioBip39IdToString(this.toJSON());
    }

    public toJSON(): SPortfolioBip39IdImported {
        return {
            source: this.source,
            seedHash: this.seedHash,
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
