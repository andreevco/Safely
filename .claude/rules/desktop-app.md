---
paths:
  - 'apps/desktop/**/*.{ts,tsx}'
  - 'apps/desktop/forge.config.ts'
  - 'apps/desktop/postcss.config.cjs'
  - 'apps/desktop/signing/**'
  - '.github/workflows/desktop-preview.yml'
---

# `apps/desktop` — Electron

The desktop app is a thin adapter: the UI comes from `@safely/web-ui`, the domain from
`@safely/core`/`@safely/sync`/`@safely/ux`. What lives here is the build, the Electron-specific
services and the platform implementation injected into the shared UI.

**macOS is the only build target for now** (`makers` in `forge.config.ts`). That is a security
decision, not just a scheduling one: the secret store relies on keychain access groups being bound to
the app's code signature, and Windows has no equivalent — see `desktop-secret-store.md`. Platform
guards already in the code (`process.platform` checks, the `win32` branch in `utils/atomic-file.ts`)
stay: they are correct cross-platform behaviour, not dead code.

## Split by process, not by feature

`src/` is divided by Electron process, and `eslint-plugin-boundaries` enforces the direction:

| Directory      | Runs in                        | May import                          |
| -------------- | ------------------------------ | ----------------------------------- |
| `src/main`     | main (node)                    | `src/shared`                        |
| `src/preload`  | sandboxed preload              | `src/shared`                        |
| `src/renderer` | renderer (sandboxed, isolated) | `src/shared`, `@safely/*` packages  |
| `src/shared`   | the IPC contract, no runtime   | nothing from the other three        |

**All domain code runs in the renderer** — the sync engine, the CRDT, the crypto, the keys. That is
deliberate: the same code has to run in the browser extension, where no privileged process exists at
all. The main process owns storage and lifecycle (the store file, the keychain, the window); it is
never a participant in the domain.

`src/renderer/app/AppProviders.tsx` assembles the `IAppContext` that every `@safely/ux` hook reads
out of a `DesktopPlatform` implementation, whose shape this app declares itself
(`src/renderer/platform/types.ts`) — the same division mobile uses, where
`apps/mobile/src/app/AppContext.tsx` does the assembly. `@safely/web-ui` supplies the pure parts
(`WebLinking`, the toast service, the logger/i18n factories); the stubs for what this target lacks
are ours (`src/renderer/platform/unsupported.ts`), because the extension will lack a different set.
The extension will repeat this wiring with its own platform.

**The renderer's platform is a module-level value, not something a component creates.**
`src/renderer/platform/index.ts` builds it once while the module graph loads, and the logger
(`src/renderer/logger.ts`), the query client and the persister (module scope in `AppProviders.tsx`)
hang off it — the same shape as `apps/mobile/src/app/App.tsx`. That is only possible because nothing
in it is asynchronous, which is why `AppInfo` reaches the renderer through the preload's argv
(`webPreferences.additionalArguments` in `src/main/window.ts`, `src/shared/app-info.ts`) instead of a
channel: a promise there would push the query client back into a `useState` and the whole boot into an
`async mount()`. The consequences of that choice are in `shared/app-info.ts`: the values are frozen
when the window is created — a `reload()` keeps the same process and the same argv — so nothing that
can change while the app runs may be added to `AppInfo`, and the renderer's argv is readable by any
process of the same user, so it carries no secret. The preload still parses it with the zod schema.

**The environment is this app's job, not the shared package's.**
`src/renderer/global-polyfills.ts` installs the globals the domain packages read at load time —
`Buffer`, `IsomorphicEventSource` (XHR-based: the SSE stream needs an `Authorization` header) and
`safelyCrypto.pbkdf2Sha512` (`pbkdf2Async` from `@noble/hashes`, which yields to the scheduler
instead of blocking the renderer) — and it is the web counterpart of
`apps/mobile/global-polyfills.ts`. `import './global-polyfills'` **must stay the first import of
`src/renderer/index.tsx`**: ES imports are evaluated before the importing module's body, and the
Ledger SDK reads `Buffer` while being evaluated. For the same reason nothing inside
`global-polyfills.ts` may import `@safely/ux` or `@safely/web-ui`, whose module graphs would then be
evaluated above the install calls.

The renderer therefore holds secret material in memory. Moving the secret handling and the signer
into main is a known, deliberately deferred option — it protects the seed's confidentiality but not
the funds, because a compromised renderer can still ask main to sign; only a main-owned confirmation
window would change that. Keep the seams intact for it: everything platform-specific reaches the UI
through `DesktopPlatform`, and secrets never land in zustand, react-query or an xstate context.

## Storage lives in main, not in the renderer

Three scopes, two backings, one interface (`Store` in `src/main/store/types.ts`): `regular` is a flat
key/value file under `userData/store/`, while `encrypted` and `secureEncrypted` are keychain items,
one per key — `desktop-secret-store.md` has that half in full.

**Each store is its own channel group** — `safely:store:*`, `safely:encrypted-store:*` and
`safely:secure-encrypted-store:*` (`src/shared/ipc.ts`), one `DesktopStoreBridge` handle each, and no
scope on the wire. A renderer therefore cannot ask for the wrong store, and a store whose rules
differ is added as another group instead of another value in a shared payload. The scope name stays a
main-side detail (`StoreScope` in `src/main/store/types.ts`).

Browser storage was rejected because it is bound to the renderer origin, which differs between
`start` (dev server) and a packaged build (`safely://app`), and because sealing values with the OS
keychain is possible only in main. `electron-store` was rejected too: it rewrites the whole
file on every `set` (its own README says it is not a database), is ESM-only against our CJS main
bundle, and cannot be reached from a sandboxed renderer — the IPC layer would be ours regardless.

**Every mutation is written through before it resolves** — no buffer, no debounce, no flush to
forget: losing a wallet's last write is worse than paying for the write. The chain per mutation is
temp file → `fsync` → `rename` over the real file (atomic: a crash leaves the old file or the new
one, never a truncated one) → `fsync` of the directory so the rename survives too. The in-memory map
is a read cache and is updated only *after* the file write succeeds, so it can never claim data the
disk does not have; concurrent mutations are serialised, or two read-modify-writes would lose an
update. `test/main/store/json-store.test.ts` pins this by reading the file back instead of trusting
the instance.

That applies to `regular` only. The secret scopes hold no file and run no crypto of ours: a value is
a keychain item, and what it is worth is decided by the access group in our code signature. There is
**no unlocked state** anywhere in main, so nothing has to be locked on hide or suspend and no
channel exists for unlocking or sealing anything — `desktop-secret-store.md` lists what was tried
before this design and why it is not coming back.

The price of the file's write-through is a full rewrite per mutation, which is fine at wallet scale;
if the data outgrows it, the way out is an embedded store with a write-ahead log (SQLite) — not a
buffer.

## `pnpm start` protects nothing, and there is still no presence gate

Two independent gaps, and confusing them wastes a day:

**The store works, but only in a signed build.** Without a provisioning profile there is no access
group, so the addon reports itself unavailable and `pnpm start` runs on the development stub inlined
in `vite.main.config.ts`: plain files in the development `userData`, protecting nothing, warning on
every start. A packaged build refuses to start rather than degrade to it. Anything you want to
believe about the store has to be checked on a signed build — `signing/verify-signature.sh` for
the signature, the running app for securityd. What exercises it by hand is the showcase's
`SECRET STORE` screen (`src/renderer/showcase/KeychainShowcase.tsx`): it lists, adds, edits and
deletes entries of either secret scope through the same `IAppContext` storage the rest of the UI uses
— `storage.sync.encrypted` and `storage.sync.getSecureEncrypted()`, so it sees the `sync` node of the
scope and not the whole keychain service — and it exists only because onboarding does not yet write a
key: the first screen that does replaces it. Reaching the secure scope needs
`UNSAFE_SKIP_SECURITY_CHECK_unlock()` while the presence gate rejects, exactly as mobile onboarding
does; that call belongs to this screen and must not spread into anything shipping a flow.

**The renderer cannot prove user presence.** `DesktopPlatform.security` is still
`unsupportedSecurityGate` (`src/renderer/platform/unsupported.ts`), so
`UnlockableSecuredEncryptedStorage` refuses even though `createSecureEncrypted()` returns a real
storage. Until a gate exists, **the desktop app cannot create or restore an account**, because
onboarding writes `master_key`, `vault_key` and `dmk_prv` through that scope. Do not "temporarily"
route those keys into `regular` or `localStorage` to unblock a flow.

## Security invariants

Do not weaken these without a threat-model note:

- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `app.enableSandbox()`.
- The preload is transport only. Every capability is a named channel with a zod-validated payload;
  never expose a generic "invoke anything" bridge. Inputs are validated in main (authoritative). The
  one non-channel member of the bridge is `appInfo`, a value injected as a process argument — no
  capability comes that way.
- CSP is built in `src/main/security.ts`, with a looser policy only while the dev server runs.
  `style-src 'unsafe-inline'` is required by `@floating-ui` inside Base UI; scripts get no such
  exemption in production. `connect-src` is an allowlist — `'self'` plus `https://*.safely.app`, where
  every endpoint the boot config hands out lives — so a new backend host fails loudly (the renderer's
  console errors are forwarded to the main log) instead of silently widening the policy.
- The **packaged** renderer gets its CSP from the `safely://` protocol handler's own response
  headers, not from the `webRequest` listener: responses served by a custom protocol handler do not
  necessarily pass through it, and a policy that quietly stops applying in the packaged build is worse
  than none.
- `window.open`, `<webview>` and navigation outside the app origin are denied for every web contents.
- A session accepts only **one** `onHeadersReceived` listener — a second registration silently
  replaces the first — so the CSP and the CORS relaxation share the single listener in
  `src/main/security.ts`. Adding another there is how the CSP disappears without a trace.
- **CORS is supplied by the platform, not by the backends.** They send no usable
  `Access-Control-Allow-Origin` — React Native never needed one, a browser context does — so the
  listener rewrites it for `*.safely.app` responses. Details that matter if you touch it:
  - Preflights *are* visible to `webRequest` (electron/electron#22407, Electron ≥ 9), so an `OPTIONS`
    the backend answers with 404/405 is rewritten into `HTTP/1.1 200 OK` plus the allow headers.
    Verified against the real sync API: a GET carrying `Authorization` reaches the server.
  - `Authorization` is listed explicitly in `access-control-allow-headers`. The `*` wildcard covers
    every header **except** that one, and both the sync API and its SSE stream send it.
  - Existing `access-control-*` headers from the backend are dropped, not respected: the sync API
    answers with its own host as the origin (`Access-Control-Allow-Origin: sync.safely.app`), which no
    browser accepts, and two values are invalid as well. When the backends serve a correct policy,
    this block can go — and it must go for a future web build, which has no privileged process.
  - Wildcards are legal here only because no request carries credentials (no cookies, no client
    certs). Do not introduce `credentials: 'include'` without revisiting this.
- Permissions are denied by default; camera (QR) and HID (Ledger) are granted per request type when
  those features land.
- Fuses in `forge.config.ts` disable `RunAsNode`, the inspector and `NODE_OPTIONS`, and enable asar
  integrity validation.

## Why the app loads from `safely://app`

In production the renderer is served by a custom privileged scheme (`src/main/app-protocol.ts`), not
`file://`: a file page gets an opaque origin, which makes IndexedDB and localStorage — where the
wallet keeps synced state — unreliable, and weakens CSP. The dev server is a different origin
(`http://localhost:*`), so browser storage does not carry over between `start` and a packaged build;
`src/main/paths.ts` keeps the dev profile in a separate `userData` directory for the same reason.

Deep links are **not wired yet**: nothing calls `setAsDefaultProtocolClient`, there is no `open-url`
listener and the bundle declares no URL type, so the OS never hands a `safely://` URL to the app.
When they land they will arrive through `open-url` / argv — a different mechanism from this handler,
which only serves requests made inside the app's session. Such a URL has a different host than the
app origin and is refused by the navigation guard, so it has to be turned into a route, never
navigated to.

Closing the window ends the whole app — renderer, sync engine and main process. There is no
`window-all-closed` handler, and Electron's default without one is to quit, on macOS as everywhere
else: `pnpm start` exits 0 the moment the window closes — measured, not assumed. Staying alive
windowless is the macOS convention and would take that handler; until it exists, the next launch is
a cold start that boots the engine from scratch and re-reads everything from the store, and
`revealMainWindow` (`src/main/index.ts`) only ever reveals a window that is still there — `activate`
or a second launch on a hidden or minimised one — with its recreate branch unreachable. So nothing
may depend on renderer memory outliving the window: whatever has to survive is written through a
store before it matters. Hiding (Cmd+H) keeps the renderer and lets Chromium throttle its timers —
`backgroundThrottling` stays at its default — and main reports the hide and the show to the renderer
as app-state events. A single instance lock guarantees one sync engine per machine. Neither path
needs store handling, there being no unlocked state to lock, but a renderer-side passcode session
would have to expire on one of them.

The renderer's logger writes to its devtools console, which is invisible when the app is driven from
a terminal, so `src/main/window.ts` forwards renderer console messages, `did-fail-load` and
`render-process-gone` into the main logger. That is how a renderer that dies during boot stays
diagnosable.

## Build

`electron-forge` (7.x) + `vite` (6.x) — `pnpm --filter @safely/desktop start | package | make`.

- **The native addon is built by one script**: `pnpm --filter @safely/desktop run build:native`,
  which is `node-gyp rebuild -C native/keychain`. `package` and `make` run it first; `start` does
  not need it, because development is aliased to the stub. The build tooling belongs to the app:
  `node-gyp` and `node-addon-api` are its devDependencies, and `binding.gyp` still resolves the
  headers because gyp runs `<!(…)` commands with the gyp file's directory as the working directory,
  from which node resolution walks up into `apps/desktop/node_modules`.
- **`native/keychain` is a plain folder, and turning it back into a workspace package is a
  regression.** pnpm gives every workspace project whose root holds a `binding.gyp` an implicit
  `install` script of `node-gyp rebuild` — the `gypfile` flag has nothing to do with it — so as a
  package it compiled on every `pnpm install` in the monorepo and failed the Linux CI job on the
  Objective-C++ sources; the only way to suppress that is an explicit `"install": "exit 0"`. A
  package bought nothing in return: nothing imports the addon by name, main loads the binary by path,
  and the surface it needs is declared in `src/main/plugins/keychain/types.ts`.
- **The packager copies `.vite` and nothing else** — the forge vite plugin sets that `ignore` itself
  and overrides any of ours. So `node_modules` never reaches the app: the addon ships as
  `extraResource` and is loaded from `process.resourcesPath` through `createRequire`, never an
  `import`. An asar unpack glob does not work here (`**/*.node` misses the dot-directory).
- **@electron/rebuild is off** — `rebuildConfig: { onlyModules: [] }`, an empty list that matches no
  module. The addon is N-API, so the Node-built binary loads in Electron unchanged, and forge's
  rebuild only blurred the picture: `start` rebuilt in the project tree, `package` inside the copied
  app directory where there is no `node_modules`, and the `.forge-meta` marker it leaves behind made
  `start` skip the rebuild after a source change.
- **The dev/prod plugin split is the bundler's**, not the code's: the development stub is a string
  inside `vite.main.config.ts`, resolved in place of `keychain-addon` — the specifier
  `plugins/keychain/index.ts` re-exports — by a plugin registered only for `serve`. Nothing
  branches at runtime, no module in `src/` can import the stub, and a packaged build has nothing to
  resolve it with. The test double is a separate file that `src/` never exports
  (`test/main/store/fake-keychain.ts`); `desktop-secret-store.md` has the reasoning and the
  trade-off.
- `make` produces a **macOS zip only**. Signing is env-driven and listed at the top of
  `forge.config.ts`: `SAFELY_SIGN_IDENTITY` turns it on, `SAFELY_SIGN_PROFILE` is mandatory with it
  (forge throws on one without the other, because a signature without its profile reaches nothing),
  `SAFELY_SIGN_KEYCHAIN` is for CI's throwaway keychain. Unsigned stays valid because the profiles are
  uncommitted, and signing is a prerequisite of the store rather than a cosmetic step: the hardened
  runtime is what keeps another process out of our memory, and the data protection keychain needs an
  embedded provisioning profile with `com.apple.application-identifier`. Never add
  `com.apple.security.cs.disable-library-validation` or `get-task-allow` to a production build —
  `signing/verify-signature.sh` fails on both, and CI runs it as a gate. Notarisation is still
  missing, so a downloaded build needs its quarantine flag removed by hand.
- **The build number reaches the app twice, from one variable.** `SAFELY_BUILD_NUMBER` — CI passes
  the counter it allocated (`../../.github/workflows/desktop-preview.yml`) — becomes
  `packagerConfig.buildVersion`, and macOS renders `Version 0.0.1 (42)` in the About panel out of
  Info.plist with no code involved; it is also a vite `define` in `vite.main.config.ts`, which
  `src/main/about-panel.ts` hands to `setAboutPanelOptions` so the panel is right in `pnpm start`
  too, where the bundle is Electron's own. Unset, `CFBundleVersion` falls back to `appVersion`
  (packager's default), so both keys read the package version, the panel has nothing to put in
  parentheses, and the code path says `local`. Two things bite: the global is replaced **only in the
  main bundle**, so a renderer read compiles and throws at runtime; and the About item comes from
  Electron's default menu, so a `Menu.setApplicationMenu` without `role: 'about'` silently removes
  it.
- **QA builds are signed by CI with its own Mac Development certificate, releases locally with
  Developer ID** (`../../.github/workflows/desktop-preview.yml`, `desktop-signing.md`). Two
  consequences for anything that touches the build: CI proves the signature is well-formed and
  nothing more — whether securityd honours it is only visible when the app runs — and a change to the
  entitlements or the bundle id has to reach the provisioning profile before the workflow can sign
  again.
- **The vite version is pinned by forge**: forge 7 is published as CommonJS and does
  `require('vite')`, and vite ≥ 7 no longer has a `require` export condition. Don't bump vite past 6
  until forge 8 is stable.
- Entries in `forge.config.ts` are **objects** (`{ main: 'src/main/index.ts' }`) because the output
  file name comes from the entry key and main and preload share `.vite/build/`; two entries named
  `index` would silently overwrite each other.
- `vite.renderer.config.ts` is this app's own config — there is no shared preset in
  `@safely/web-ui` any more, so the React plugin, `dedupe`, `optimizeDeps.exclude` for the
  source-shipping workspace packages and `preserveSymlinks` all live here.
- The renderer sets `resolve.preserveSymlinks: false`, overriding forge's default. With pnpm, `true`
  would resolve react twice (broken hooks) and make the shared stylesheet look like a `node_modules`
  file to Panda's PostCSS plugin, which skips those.
- Panda is wired in `postcss.config.cjs` and points at the single config in `packages/web-ui`. The
  callable plugin is `require('@pandacss/postcss').default`; the object plugin form fails.
- Two workspace-level settings exist only for forge: `hoistPattern: ['*']` (already pnpm's default —
  forge refuses to package unless it is stated explicitly) and the `@electron/node-gyp` override
  (forge's transitive `@electron/rebuild` declares it as a git URL, which `blockExoticSubdeps`
  rejects). Neither changes the installed layout.
- `pnpm install` does not always run electron's postinstall; if `node_modules/electron/dist` is
  missing, run `node install.js` inside that package. A packaging CI job will need the same.
- `productName` in `package.json` decides `app.getName()`, the `userData` directory and the bundle
  name — without it they would all be the scoped package name.
