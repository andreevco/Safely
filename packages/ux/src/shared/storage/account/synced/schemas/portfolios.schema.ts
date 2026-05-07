import z from 'zod';

import {
    assertUnreachable,
    PortfolioIdMnemonicBased,
    PortfolioIdWatchOnly,
    PortfolioType,
    sPortfolio
} from '@safely/core';
import { orderedSet, orderedValues, toOrderedSet } from '@safely/slottree';

export const sPortfolios = z.union([orderedSet(sPortfolio), z.null()]);

type SPortfolioIn = z.input<typeof sPortfolio>;
type SPortfolioOut = z.output<typeof sPortfolio>;
export type SPortfoliosIn = z.input<typeof sPortfolios>;
export type SPortfoliosOut = z.output<typeof sPortfolios>;

export function getPortfolioStorageId(item: SPortfolioIn): string {
    switch (item.type) {
        case PortfolioType.BIP39:
            return new PortfolioIdMnemonicBased(item.id.hash, item.id.networkType).toString();
        case PortfolioType.WATCH_ONLY:
            return new PortfolioIdWatchOnly(
                item.id.identifier,
                item.id.source,
                item.id.networkType,
                item.id.vmType
            ).toString();
        default:
            assertUnreachable(item);
    }
}

export function portfoliosToOrderedSet(
    items: readonly SPortfolioIn[]
): Exclude<SPortfoliosIn, null> {
    return toOrderedSet(items, getPortfolioStorageId);
}

export function portfoliosFromOrderedSet(items: Exclude<SPortfoliosOut, null>): SPortfolioOut[] {
    return orderedValues(items);
}
