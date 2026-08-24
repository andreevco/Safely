---
paths:
  - 'packages/ux/src/**/*.{ts,tsx}'
  - 'packages/web-ui/src/**/*.{ts,tsx}'
  - 'apps/mobile/src/**/*.{ts,tsx}'
---

# FSD layers in `@safely/ux`, `@safely/web-ui` and `apps/mobile`

Boundaries are enforced by `eslint-plugin-boundaries` (`eslint.config.js`, `boundaries/element-types`).
An "upward" import is a build error, not a style nit.

`packages/ux/src`: `shared` → `entities` → `features`
`packages/web-ui/src`: `shared` → `entities` → `features` → `pages` → `app`
`apps/mobile/src`: `shared` → `entities` → `features` → `screens` → `app`

`apps/desktop` is not layered this way — it is split by Electron process; see `desktop-app.md`.

A layer may only import layers to its left. `shared` knows nothing about `entities`; `entities`
knows nothing about `features`; in mobile, `features` knows nothing about `screens` or `app`, and so on.

## What goes where

- `shared` — reusable with no domain meaning: UI primitives, formatting, contexts and providers,
  query-client wrappers, i18n, logger, storage adapters.
- `entities` — one domain entity: its queries/mutations, cache keys, selectors, and small
  presentational components for that entity (`account`, `asset`, `portfolio`, `contact`, …).
- `features` — a user scenario that composes entities (`blockchain-send`, `exchange`, `ledger`,
  `receive`, `onboarding`, …).
- `apps/mobile/src/screens` — a navigation screen: a directory with `<Name>Screen.tsx` /
  `<Name>Modal.tsx`. A screen composes features and holds no domain logic of its own.
- `apps/mobile/src/app` — entry point: navigation, providers, error boundary, storage and
  tanstack-query bootstrapping.
- `packages/web-ui/src/shared` — the web design system (`shared/ui`, Panda recipes live in
  `packages/web-ui/panda/recipes`). No platform contract lives here — each app declares its own
  (`apps/desktop/src/renderer/platform/types.ts`).
- `packages/web-ui/src/pages` — one screen, the web counterpart of a mobile screen: props in, markup
  out, no routing.
- `apps/desktop/src/renderer/app` — the web target's entry point: the route tree, the guards, the
  providers and the controller hooks that turn a screen's callbacks into flows. `web-ui` never imports
  app code (enforced), and the router lives here so a second target can wire the same screens
  differently.

Put new code in the lowest layer that fits. If a feature needs something from `screens`, the logic
should move down into `features` — don't move the import up.

## Layer public API

Every layer and every module inside it is re-exported through `index.ts` (`packages/ux/src/index.ts`
→ `shared`/`entities`/`features` → modules). Externally the `@safely/ux` package exposes the barrel
plus three subpaths: `@safely/ux/assets/icons/*`, `@safely/ux/theme` and `@safely/ux/translations`.
Inside the package, import a module through its `index.ts`, not through an internal file.

`shared/theme` and `shared/i18n/translations` have their own subpaths because their consumers run
outside React — the unistyles config and the i18next bootstrap in `apps/mobile`, the Panda config in
`packages/web-ui` (plain node). Importing the barrel there would drag react and react-query into a
build script or into module-init order, so keep both modules dependency-free: plain data, no imports
beyond the JSON files.

Mobile uses the `tsconfig.json` aliases for internal imports: `@mobile/shared`, `@mobile/entities`,
`@mobile/features`, `@mobile/screens`, `@mobile/app` (and their `/*` variants). Relative paths are
for imports within a single module only.

## State and data

- Server data uses tanstack-query. Cache keys are declared with `defineQueryKeys` from
  `packages/ux/src/shared/query-core/query-key-factory`, usually in the module's `keys.ts`; never
  write literal key arrays. These calls run at module import time — that's why import cycles are
  hard-banned.
- Local client state is a zustand store inside its own module.
- Multi-step flows and forms (send, exchange, onboarding) are xstate machines; the machine lives next
  to its scenario (`packages/ux/src/features/forms/**`).
- Query-cache persistence goes through `query-core/persistence.ts` and the managers in
  `apps/mobile/src/app/tanstack-query-managers.ts` — don't hand-roll a cache.
