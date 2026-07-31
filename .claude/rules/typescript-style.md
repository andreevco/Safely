---
paths:
  - '**/*.{ts,tsx}'
---

# TypeScript style

Formatting is prettier (`.prettierrc.json`: 4 spaces, single quotes, `printWidth: 100`, no trailing
comma, `arrowParens: avoid`). Everything from "Types" down is an eslint `error` and blocks CI; the
class convention below is a design preference the linter can't check.

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

- `any` is banned. Unknown input (API responses, storage contents) is `unknown` parsed by a zod
  schema; zod is available in every package through `catalog:`.
- Type imports are separate statements: `import type { Foo } from '...'` (`consistent-type-imports`
  with `separate-type-imports`, plus `no-import-type-side-effects`).
- Class members carry explicit accessibility (`public`/`private`/`protected`) — except the
  constructor, where `public` is omitted. Fields that are never reassigned must be `readonly`
  (`prefer-readonly`).
- Enum members are `UPPER_CASE`.
- `no-inferrable-types`: don't annotate what is already inferred (`const x: number = 1`).

## Equality

`eqeqeq: smart` plus the local rule `iseq/no-strict-eq-when-isEq` (`eslint-rules/isEqPlugin.js`):
if a type exposes `isEq`/`isEqual`/`eq`/`equals`, compare with that method instead of `===`/`!==` —
otherwise you compare references and the check silently never holds. This matters for domain value
objects (addresses, amounts, ids).

## Imports

`import/order` with mandatory blank lines between groups and alphabetical sorting inside each:

1. builtin + external
2. `@safely/**` (internal, first)
3. `@mobile/**` (internal, last)
4. relative: parent → sibling → index

## Misc

- `no-console` is an error everywhere except logger implementations
  (`apps/mobile/src/shared/logger/**`, `packages/sync/src/logger/**`) and tests. Write to the logger.
- Unused variables and imports are errors; prefix deliberately unused ones with `_`.
- `complexity` is an error: split a function whose branching exceeds the default threshold.
- `no-restricted-syntax`: no labeled statements, no `with`.
