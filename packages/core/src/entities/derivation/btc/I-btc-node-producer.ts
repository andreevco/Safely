import type { HDKey } from '@scure/bip32';

export interface IBtcNodeProducer {
    getPortfolioDerivation(): Promise<HDKey>;
}
