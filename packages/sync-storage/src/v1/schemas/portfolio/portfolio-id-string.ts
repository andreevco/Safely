import type { SPortfolioBip39Id } from './portfolio-bip39.schema';
import type { SPortfolioWatchOnlyId } from './portfolio-watch-only.schema';

function join(...parts: (string | number)[]): string {
    return parts.map(p => String(p)).join(':');
}

export function portfolioBip39IdToString(id: SPortfolioBip39Id): string {
    switch (id.source) {
        case 'MASTER_KEY_DERIVED':
            return join('portfolio', 'BIP39', id.source, id.derivationIndex, id.networkType);
        case 'IMPORTED':
            return join('portfolio', 'BIP39', id.source, id.mnemonicHash, id.networkType);
    }
}

export function portfolioWatchOnlyIdToString(id: SPortfolioWatchOnlyId): string {
    switch (id.source) {
        case 'XPUB':
            return join('portfolio', 'WATCH_ONLY', id.source, id.xpub, id.networkType);
        case 'ADDRESS':
            return join('portfolio', 'WATCH_ONLY', id.source, id.address, id.networkType);
    }
}
