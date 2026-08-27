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
`apps/desktop/src/renderer`: `shared` → `features` → `screens` → `app`, next to `platform/`

`apps/desktop` is split by Electron process **first** — see `desktop-app.md`; the layers above exist
inside `src/renderer` only, and `boundaries` enforces them there as it does in mobile. There is no
`entities` layer: the domain entities come from `@safely/ux`, so the renderer holds scenarios only.
`platform/`, `logger.ts` and `i18n.ts` sit outside the layers — they are the app's contract with
Electron, and every layer may read them.

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
- `packages/web-ui/src/features` — a scenario shared by the web targets: the presentational modals of
  the slice plus the controller hook and the modal switch that drive them (`add-wallet`, `wallet`,
  `account`, `contact`). A flow belongs here only while it binds to nothing but `@safely/ux`
  contracts; see `web-ui.md`. A slice with no modals belongs here too when it reads a `@safely/ux`
  query and composes an entity into a screen region (`history`): it takes callbacks for everything
  that leaves it, so the page still owns where a click goes.
- `packages/web-ui/src/pages` — one screen, the web counterpart of a mobile screen: props in, markup
  out, no routing. A flow lives in the component that triggers it, together with its modal switch, and
  moves up to the page only when more than one component triggers it (`pages/main/MainPage.tsx`) —
  then it travels as one prop, never as a page-level context; see `web-ui.md`.
- `apps/desktop/src/renderer/shared` — the route constants and the structured storages (the
  `desktop` node of the regular and encrypted stores).
- `apps/desktop/src/renderer/features` — one scenario per directory (`passcode`, `biometry`,
  `app-lock`, `onboarding`), each owning its `keys.ts`: the controller hooks that turn a screen's
  callbacks into flows, plus the modals those flows own. Only the scenarios bound to this target are
  here — the rest are in `packages/web-ui/src/features`. Features may import each other; nothing here
  may import `screens/` or `app/`. Composing features into one capability is `app/`'s job — the
  security gate handed to `IAppContext` is built in `app/AppProviders.tsx`, not in a feature.
- `apps/desktop/src/renderer/screens` — one route component each, the web counterpart of a mobile
  screen: it composes features and holds no domain logic of its own.
- `apps/desktop/src/renderer/app` — the entry point: the route tree, the guards and the providers.
  `web-ui` never imports app code (enforced), and the router lives here so a second target can wire
  the same screens differently.

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

## Sharing between platforms: pieces, not flows

The same scenario often exists on mobile and on a web target — passcode, lockout, biometry — and the
platforms genuinely disagree about the flow: mobile navigates to a screen where desktop renders an
overlay, mobile prompts biometry again on the passcode screen where desktop deliberately does not,
the lock screen defaults on for desktop and off for mobile. So the flow stays out of `@safely/ux`,
and what moves into it is the part with no platform and no flow in it:

- **pure policy and transitions** — `nextLockoutState`, `defaultLockoutPolicy`, `sLockoutState`,
  `PASSCODE_LENGTH` (`shared/security/`). A schedule is injected as a *function* with a default, so
  an app can replace the curve without inheriting a data shape, and `now` is a parameter so the
  transition tests without fake timers.
- **copy decisions that are not rendering** — `lockoutRemainingCopy` returns a translation key plus a
  count, never a string: the `t()` call and the markup stay per platform.
- **React primitives with no domain** — `useSubmitWhenComplete`, `useEnteredBackground`,
  `useCountdownToTimestamp` (`shared/react/`, `shared/app/`). `useSubmitWhenComplete` fires on the
  *transition* into a full value rather than on the state, which is what lets mobile hold the entered
  code on screen for its 300 ms success animation without a second submit; clearing the value stays
  the caller's job.
- **a screen's view model, when both platforms decide it identically** — `useHistoryGroups` plus the
  pure `buildHistoryGroupViews` (`features/history`), the same shape as
  `features/home-screen/useHomeScreenList`: the hook composes the entity queries and the formatters,
  the builder turns `ActivityItemsDatedGroup[]` into rows whose title, sign, tone, counterparty and
  timestamp are already decided. It renders nothing and navigates nowhere — every row carries its
  `activity`, and each app builds `onPress`/`onSelect` from that. Both apps then declare
  `ActivityItemProps = Omit<ActivityRowView, 'key' | 'activity'> & { onPress | onSelect }`, so the
  view model is also the prop contract and a renamed field is a type error instead of a drift.
  This module takes a `TranslateFn` and returns display strings, the way `getDateGroupTitle` does,
  because a date heading needs a formatted date; the key-plus-count rule above still holds for copy
  a platform assembles itself.
- **the mechanism of a typed key/value store** — `createStructuredStorage` / `useStructuredStorage`
  (`shared/storage/`): a zod shape plus a `TreeStorage` node in, typed `get`/`set`/`remove` out, with
  parse-on-read and parse-on-write written once. Each app supplies its own node and its own shape
  (`apps/mobile/src/shared/storage/structured/`,
  `apps/desktop/src/renderer/shared/storage/structured/`) and wraps the hook under its own name —
  which keys exist, and where they live, stays the app's decision. An **absent key reaches the shape
  as `null`**, so every entry is written `z.union([z.null(), …])`; a shape that omits the null branch
  throws on the first read, which is the path taken on a fresh install.

The web targets are the exception, and only among themselves: they render the same overlays, so a
flow that binds to nothing but `@safely/ux` is shared through `packages/web-ui/src/features` rather
than copied into each app — that is a step sideways within the web family, not up into `@safely/ux`,
which mobile also reads.

What must **not** move up: a hook that binds a query key to a storage location to a default
(`usePasscode`, `useLockScreen`, `useBiometryQuery`), the composition of security factors, or
anything that would need a `createXHook(platformApi)` shape to fit both callers. That signature is
the signal the boundary is wrong — split a smaller piece out instead.

Two duplicates that had already diverged before the split are why this is written down: the
minutes-to-hours threshold in the lockout copy, and re-reading the attempt count versus trusting the
query cache. Copy-paste between the apps does not stay in sync; extracted pieces do.
