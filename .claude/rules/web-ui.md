---
paths:
  - 'packages/web-ui/**/*.{ts,tsx}'
  - 'packages/web-ui/panda.config.ts'
  - 'apps/desktop/**/*.{ts,tsx}'
  - 'apps/browser/**/*.{ts,tsx}'
---

# `@safely/web-ui` — components and styling

The React layer shared by every web target (`apps/desktop`, later `apps/browser`). It holds the
design system, the pages and the platform interfaces; it must stay free of platform code the same way
`@safely/ux` stays free of React Native. Layers: see `fsd-layers.md`.

Stack: `@base-ui/react` (headless components) + `@pandacss/dev` (zero-runtime styling) on top of
`@safely/ux` for all screen logic. Zero-runtime matters beyond bundle size: the MV3 extension's CSP
forbids injecting styles at runtime.

## Panda needs codegen before anything else

`styled-system/` is generated (`panda codegen`) and gitignored. Without it the generated types are
empty, so `compile`, `lint` and `test` all run codegen first — that is why the scripts look the way
they do, and why `pnpm -r run` (topological) is the way to build the apps that depend on this package.

There is exactly **one** Panda instance in the monorepo: `packages/web-ui/panda.config.ts`. Its
`include` covers the apps as well, and `importMap` makes the generated helpers importable everywhere
as `@safely/web-ui/styled-system/*`. Apps only point their `postcss.config.cjs` at that config —
never add a second one.

Run lint through the package scripts (`pnpm --filter <pkg> run lint`, which is also what CI does).
`@pandacss/eslint-plugin` resolves included files relative to the working directory, so invoking
`eslint` from the repo root reports spurious `file-not-included` errors for app files.

## Tokens come from `@safely/ux/theme`, always

`panda/tokens.ts` reshapes those objects into Panda tokens; it never restates a value. A colour or a
spacing literal written anywhere else is a defect — `@pandacss/no-hardcoded-color` is an error, and
values must stay in sync with the mobile app, which reads the same objects.

Only a dark palette exists. When a light one appears, the mapper starts emitting
`{ base, _dark }` values and components stay untouched: token paths don't change.

## Panda drops dynamic values silently

No build error, no style — just missing CSS. `css({ color: someVariable })`, `colorByType[type]`,
`<Box p={spacing}>` all extract to nothing. `@pandacss/no-dynamic-styling` is an error for this
reason. For genuinely dynamic values (a percentage, a user-chosen colour) set an inline CSS variable
and read it from a static style: `style={{ '--fill': value }}` plus `width: 'var(--fill)'`.

## Base UI conventions

- Component state is exposed as **data attributes**; style them through the conditions declared in
  `panda.config.ts` (`_open`, `_highlighted`, `_selected`, `_enter`, `_exit`).
- `className` and `style` also accept a **function of state** — never use that form: Panda cannot
  extract it. Components in `shared/ui` narrow `className` to `string` to make this a type error.
- Pass a recipe class name to a Base UI part; do not wrap parts in `styled()`. Without
  `shouldForwardProp` a wrapper leaks style props into the DOM.
- Multipart components (`Root / Trigger / Positioner / Popup / Item`) map slot-for-slot onto a
  `defineSlotRecipe`. Element composition uses the `render` prop, not `asChild`.
- Recipes live in `packages/web-ui/panda/recipes/*.recipe.ts`, outside `src`: `defineRecipe` is a
  config-time function and calling it from source is an eslint error
  (`@pandacss/no-config-function-in-source`).
- `@floating-ui` inside Base UI sets inline `style` for positioning, so a CSP must allow
  `style-src 'unsafe-inline'`; Base UI ships `./csp-provider` for nonce-based setups.

## The platform contract, and who assembles it

`shared/platform` declares `WebPlatform` — what a target must provide (the three storages, the
synchronous one, the user-presence gate, external links, app state, app info) — plus the pieces built
on it: `WebLinking`, the toast service, the "unsupported" stubs for QR and Ledger, the logger and
i18next factories, and the globals bootstrap. Assembling those into `IAppContext` is the **app's**
job (`apps/desktop/src/renderer/app/AppProviders.tsx`), mirroring how `apps/mobile/src/app` does it.

`@safely/web-ui/bootstrap` installs the three globals the domain packages expect (`Buffer`,
`IsomorphicEventSource`, `safelyCrypto.pbkdf2Sha512`) and **must be the first import of an app
entry**: ES imports are evaluated before the importing module's body, and the Ledger SDK reads
`Buffer` while being evaluated. For the same reason that file imports
`shared/platform/globals` directly rather than through the barrel — the barrel would pull
`@safely/ux` (and with it `@safely/core`) above the install call. It is one of the few places where
bypassing a barrel is correct.

## Build wiring

`build/vite-preset.ts` is the shared Vite config every app merges in (React plugin, `dedupe` for
react, and `optimizeDeps.exclude` for the workspace packages — they are TypeScript source, not build
artefacts, and prebundling them resolves stale copies). Styles reach an app through
`@safely/web-ui/styles.css`, whose only content is the Panda layer declaration; base styles live in
`globalCss` in the config so they can use tokens.
