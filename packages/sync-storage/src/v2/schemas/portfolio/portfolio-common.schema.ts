import z from 'zod';

export {
    sPortfolioMeta,
    sPortfolioNetworkType,
    type SPortfolioMeta
} from '../../../v1/schemas/portfolio/portfolio-common.schema';

export const sPortfolioType = z.enum(['BIP39', 'WATCH_ONLY', 'LEDGER']);
