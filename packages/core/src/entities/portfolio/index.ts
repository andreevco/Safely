export * from './I-portfolio';
export * from './portfolio-id';
export * from './portfolio-id-watch-only';
export * from './portfolio-bip39';
export * from './portfolio-watch-only';
export * from './portfolio-factory';
export * from './portfolio-meta';
export * from './portfolio-network-type';
export * from './portfolio.stored';

import { PortfolioBip39 } from './portfolio-bip39';
import { PortfolioWatchOnly } from './portfolio-watch-only';

export type Portfolio = PortfolioBip39 | PortfolioWatchOnly;
