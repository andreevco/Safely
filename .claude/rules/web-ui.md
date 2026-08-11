---
paths:
  - 'packages/web-ui/**/*.{ts,tsx}'
  - 'packages/web-ui/panda.config.ts'
  - 'apps/desktop/**/*.{ts,tsx}'
  - 'apps/browser/**/*.{ts,tsx}'
---

# `@safely/web-ui` — components and styling

The React layer shared by every web target (`apps/desktop`, later `apps/browser`). It holds the design
system and the pages, and nothing else: it must stay free of platform code the same way `@safely/ux`
stays free of React Native, and free of platform *contracts* too — those belong to the apps. Layers:
see `fsd-layers.md`.

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

## No platform contract lives here

This package supplies parts — `WebLinking`, the toast service, the logger and i18next factories, the
design system — and the **app** decides what a platform is. `apps/desktop/src/renderer/platform/`
declares its own `DesktopPlatform` and assembles `IAppContext` from it in
`app/AppProviders.tsx`, mirroring `apps/mobile/src/app`; the extension will describe itself with its
own shape, which differs in storage, in user presence and in how links open.

Stubs for capabilities a target lacks are the app's too
(`apps/desktop/src/renderer/platform/unsupported.ts`): what is missing differs per target, and a
shared "unsupported" list would quietly define the extension's gaps as well. Desktop currently stubs
QR, Ledger, the secret storage and the user-presence gate — the last two because there is no vault yet
(`apps/desktop/doc/vault.md`), and they reject rather than fall back to the `encrypted` scope.

A type that describes *what an app must provide* therefore does not belong here, and neither does
anything a component only needs because some target happens to work that way. What a shared component
needs, it takes as a prop.

## This package owns no environment

Everything here is pure and stateless: components, hooks, formatting, `WebLinking`, the logger and
i18next factories, the platform types. Anything that touches the runtime — installing globals,
polyfills, build configuration — belongs to the app, because the two web targets do not share a
runtime (an Electron renderer and an MV3 page differ in CSP, in available APIs and in how they are
bundled), and a package that reaches for the environment forces both of them into one shape.

Concretely, and deliberately absent: there is **no `./bootstrap` entry and no `globals.ts`** — the
globals the domain packages read (`Buffer`, `IsomorphicEventSource`, `safelyCrypto.pbkdf2Sha512`) are
installed by `apps/desktop/src/renderer/bootstrap.ts`, the web counterpart of
`apps/mobile/global-polyfills.ts`, and the extension will get its own copy. There is also **no shared
Vite preset**: each app writes its own config (`apps/desktop/vite.renderer.config.ts`). If a third web
target ever repeats the same twenty lines, extract them then — a shared build config is how
environment assumptions creep back in.

## Build wiring

Styles reach an app through `@safely/web-ui/styles.css`, whose only content is the Panda layer
declaration; base styles live in `globalCss` in the config so they can use tokens.
