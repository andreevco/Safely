import { z } from "zod";
import { orderedSet } from "../../src";

const sAddressMetaV2 = z.object({
  derivation: z.object({
    source: z.object({
      path: z.string(),
      discoveredAtBlock: z.number(),
    }),
  }),
});

const sAddressV2 = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  meta: sAddressMetaV2,
});

const sBtcChainV2 = z.object({
  xpub: z.string(),
  addresses: orderedSet(sAddressV2),
});

const sAccountV2 = z.object({
  id: z.string(),
  name: z.string(),
  chains: z.object({
    btc: sBtcChainV2,
  }),
});

const sPortfolioV2 = z.object({
  id: z.string(),
  name: z.string(),
  accounts: orderedSet(sAccountV2),
});

export const sWalletsV2 = z.object({
  portfolios: orderedSet(sPortfolioV2),
});

export type WalletsV2 = z.output<typeof sWalletsV2>;
export type PortfolioV2 = WalletsV2["portfolios"]["setById"][string];
export type AccountV2 = PortfolioV2["accounts"]["setById"][string];
export type ChainV2 = AccountV2["chains"];
export type BtcChainV2 = ChainV2["btc"];
export type AddressSetV2 = BtcChainV2["addresses"];
export type AddressV2 = AddressSetV2["setById"][string];
export type AddressMetaV2 = AddressV2["meta"];
export type AddressDerivationV2 = AddressMetaV2["derivation"];
export type AddressSourceV2 = AddressDerivationV2["source"];
