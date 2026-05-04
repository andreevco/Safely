import { z } from "zod";
import { orderedSet } from "../../src";

const sAddressMetaV1 = z.object({
  derivation: z.object({
    source: z.object({
      path: z.string(),
    }),
  }),
});

const sAddressV1 = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  meta: sAddressMetaV1,
});

const sBtcChainV1 = z.object({
  xpub: z.string(),
  addresses: orderedSet(sAddressV1),
});

const sAccountV1 = z.object({
  id: z.string(),
  name: z.string(),
  chains: z.object({
    btc: sBtcChainV1,
  }),
});

const sPortfolioV1 = z.object({
  id: z.string(),
  name: z.string(),
  accounts: orderedSet(sAccountV1),
});

export const sWalletsV1 = z.object({
  portfolios: orderedSet(sPortfolioV1),
});

export type WalletsV1 = z.output<typeof sWalletsV1>;
export type PortfolioV1 = WalletsV1["portfolios"]["setById"][string];
export type AccountV1 = PortfolioV1["accounts"]["setById"][string];
export type ChainV1 = AccountV1["chains"];
export type BtcChainV1 = ChainV1["btc"];
export type AddressSetV1 = BtcChainV1["addresses"];
export type AddressV1 = AddressSetV1["setById"][string];
export type AddressMetaV1 = AddressV1["meta"];
export type AddressDerivationV1 = AddressMetaV1["derivation"];
export type AddressSourceV1 = AddressDerivationV1["source"];
