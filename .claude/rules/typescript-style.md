---
paths:
  - '**/*.{ts,tsx}'
---

# TypeScript style

Formatting is prettier (`.prettierrc.json`) and the rest of the style is eslint `error`s that block
CI — run lint instead of memorising them. What follows is only what an error message won't tell you.

## Domain logic is written as classes

Business logic — especially in `packages/core` — is class-based, and new code follows that. When
several functions in one domain area keep taking the same arguments, those repeated arguments belong
in the constructor and the functions become methods:

```ts
// instead of
export function estimateFee(xpub: Xpub, network: Network, utxos: Utxo[], rate: FeeRate) {}
export function buildTransaction(xpub: Xpub, network: Network, utxos: Utxo[], to: Address) {}

// prefer
export class BtcTransactionBuilder {
    public constructor(
        private readonly xpub: Xpub,
        private readonly network: Network,
        private readonly utxos: Utxo[]
    ) {}

    public estimateFee(rate: FeeRate) {}
    public buildTransaction(to: Address) {}
}
```

Existing examples to model on: `NumberFormatter`, `LedgerController`, `TreeStorage`, and the
`ApiClient` subclasses (`BtcApi`, `PriceApi`, …).

A lone function stays a function — don't wrap a single operation in a class just to have one. Pure
helpers without shared state stay functions too.

## Types

`any` is banned, and unknown input (API responses, storage contents) is `unknown` parsed by a zod
schema — zod is available in every package through `catalog:`. The ban is a lint error; reaching for
zod rather than a cast is not.

## Equality

`eqeqeq: smart` plus the local rule `iseq/no-strict-eq-when-isEq` (`eslint-rules/isEqPlugin.js`):
if a type exposes `isEq`/`isEqual`/`eq`/`equals`, compare with that method instead of `===`/`!==` —
otherwise you compare references and the check silently never holds. This matters for domain value
objects (addresses, amounts, ids).
