import { createStorage, getById, insert, toOrderedSet } from "../../src";
import { createOriginContainer } from "../../src/core/slots";
import { cloneSlot, slotFromJson } from "../../src/core/slots/slot-json";
import {
  defineVersionHList,
  hCons,
  hNil,
} from "../../src/core/versioning/version";
import { type WalletsV1, sWalletsV1 } from "./v1";
import { sWalletsV2 } from "./v2";
import { projectWalletsV1ToV2, projectWalletsV2ToV1 } from "./v2projection";

const walletVersions = defineVersionHList(
  hCons(
    {
      version: 2,
      schema: sWalletsV2,
      initial: {
        portfolios: toOrderedSet([]),
      },
      projectUp: projectWalletsV1ToV2,
      projectDown: projectWalletsV2ToV1,
    },
    hCons(
      {
        version: 1,
        schema: sWalletsV1,
        initial: {
          portfolios: toOrderedSet([]),
        },
        projectUp: cloneSlot,
        projectDown: cloneSlot,
      },
      hNil,
    ),
  ),
);

function sampleWalletsV1(): WalletsV1 {
  return {
    portfolios: toOrderedSet([
      {
        id: "portfolio-main",
        name: "Main portfolio",
        accounts: toOrderedSet([
          {
            id: "btc-main",
            name: "BTC main",
            chains: {
              btc: {
                xpub: "xpub-main",
                addresses: toOrderedSet([
                  {
                    id: "addr-0",
                    label: "Savings",
                    address: "bc1q-savings",
                    meta: {
                      derivation: {
                        source: {
                          path: "m/84'/0'/0'/0/0",
                        },
                      },
                    },
                  },
                ]),
              },
            },
          },
        ]),
      },
    ]),
  };
}

export function createWalletStorage() {
  const v1Root = createOriginContainer({
    "1": slotFromJson(sampleWalletsV1(), 10, "old-device"),
  });

  return createStorage({
    authorId: "device-2",
    versions: walletVersions,
    root: v1Root,
  });
}

export function mustGet<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

export function readMainAccount(
  storage: ReturnType<typeof createWalletStorage>,
) {
  const portfolio = mustGet(
    getById(storage.read().portfolios, "portfolio-main"),
    "Portfolio was not migrated",
  );

  return mustGet(
    getById(portfolio.accounts, "btc-main"),
    "Account was not migrated",
  );
}

export function insertDailyAddress(
  storage: ReturnType<typeof createWalletStorage>,
): void {
  storage.update((draft) => {
    const portfolio = mustGet(
      getById(draft.portfolios, "portfolio-main"),
      "Portfolio was not migrated",
    );
    const account = mustGet(
      getById(portfolio.accounts, "btc-main"),
      "Account was not migrated",
    );

    account.chains.btc.addresses = insert(account.chains.btc.addresses, {
      id: "addr-1",
      label: "Daily",
      address: "bc1q-daily",
      meta: {
        derivation: {
          source: {
            path: "m/84'/0'/0'/0/1",
            discoveredAtBlock: 840_000,
          },
        },
      },
    });
  });
}
