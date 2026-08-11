---
paths:
  - 'apps/desktop/**/*.{ts,tsx}'
  - 'apps/desktop/forge.config.ts'
  - 'apps/desktop/postcss.config.cjs'
---

# `apps/desktop` — Electron

The desktop app is a thin adapter: the UI comes from `@safely/web-ui`, the domain from
`@safely/core`/`@safely/sync`/`@safely/ux`. What lives here is the build, the Electron-specific
services and the platform implementation injected into the shared UI.

**macOS is the only build target for now** (`makers` in `forge.config.ts`). That is a security
decision, not just a scheduling one: the secret vault relies on the Secure Enclave being bound to the
app's code signature, and Windows has no equivalent — see `doc/vault.md`. Platform guards already in
the code (`process.platform` checks, the `win32` branch in `json-store.ts`) stay: they are correct
cross-platform behaviour, not dead code.

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
all. The main process owns storage and lifecycle (the store files, `safeStorage`, windows, deep links)
and will own the vault; it is never a participant in the domain.

`src/renderer/app/AppProviders.tsx` assembles the `IAppContext` that every `@safely/ux` hook reads
out of a `DesktopPlatform` implementation, whose shape this app declares itself
(`src/renderer/platform/types.ts`) — the same division mobile uses, where
`apps/mobile/src/app/AppContext.tsx` does the assembly. `@safely/web-ui` supplies the pure
parts (`WebLinking`, the toast service, the logger/i18n factories); the stubs for what
this target lacks are ours (`src/renderer/platform/unsupported.ts`), because the extension will lack a
different set. The extension will repeat this wiring with its own platform.

**The environment is this app's job, not the shared package's.**
`src/renderer/bootstrap.ts` installs the globals the domain packages read at load time — `Buffer`,
`IsomorphicEventSource` (XHR-based: the SSE stream needs an `Authorization` header) and
`safelyCrypto.pbkdf2Sha512` (`pbkdf2Async` from `@noble/hashes`, which yields to the scheduler instead
of blocking the renderer) — and it is the web counterpart of `apps/mobile/global-polyfills.ts`.
`import './bootstrap'` **must stay the first import of `src/renderer/index.tsx`**: ES imports are
evaluated before the importing module's body, and the Ledger SDK reads `Buffer` while being evaluated.
For the same reason nothing inside `bootstrap.ts` may import `@safely/ux` or `@safely/web-ui`, whose
module graphs would then be evaluated above the install calls.

The renderer therefore holds secret material in memory. Moving the vault and the signer into main is
a known, deliberately deferred option — it protects the seed's confidentiality but not the funds,
because a compromised renderer can still ask main to sign; only a main-owned confirmation window
would change that. Keep the seams intact for it: everything platform-specific reaches the UI through
`DesktopPlatform`, and secrets never land in zustand, react-query or an xstate context.

## Storage lives in main, not in the renderer

Both storages (`regular`, `encrypted`) are flat key/value files under `userData/store/`, owned by main
and reached over the bridge (`src/main/store/`).

**Each store is its own channel group** — `safely:store:*` and `safely:encrypted-store:*`
(`src/shared/ipc.ts`), one `DesktopStoreBridge` handle each, and no scope on the wire. A renderer
therefore cannot ask for the wrong store, and a store whose rules differ (the vault in `doc/vault.md`,
readable only while unlocked) is added as a third group instead of a third value in a shared payload.
The store name stays a main-side detail (`StoreScope` in `src/main/store/index.ts`).

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

`encrypted` passes every value through `safeStorage`; if the OS cannot encrypt, it throws rather than
write plaintext. That is **at-rest protection only** — the keychain entry's ACL is phishable and
`safeStorage` has no per-item authentication, so anything that must survive malware running as the
user does not belong in this scope. The price of the above is a full rewrite per mutation, which is
fine at wallet scale; if the data outgrows it, the way out is an embedded store with a write-ahead log
(SQLite) — not a buffer.

## There is no secret storage right now

The `secureEncrypted` scope and the Touch ID gate (`security.check()`, a 30-second in-memory ticket in
`src/main/user-presence.ts`) **were removed on purpose**, because the ticket was a policy check rather
than a key: it stopped a person at an unlocked machine and not malware, which reads the store file and
calls the keychain itself. `doc/vault.md` is the design that replaces them — a DEK wrapped by both a
passcode (scrypt) and a Secure Enclave key, so a locked vault is unreadable instead of merely refused.
Read it before adding anything back.

Until it lands, `DesktopPlatform.storage.createSecureEncrypted()` and `DesktopPlatform.security` are
the `unsupportedSecureEncryptedStorage` / `unsupportedSecurityGate` stubs from
`src/renderer/platform/unsupported.ts`: every
operation rejects and `isAvailable` is `false`. The consequence is deliberate — **the desktop app
cannot create or restore an account**, because onboarding writes `master_key`, `vault_key` and
`dmk_prv` into that scope. Do not "temporarily" route those keys into `encrypted`, `regular` or
`localStorage` to unblock a flow; that is exactly the outcome the removal exists to prevent.

## Security invariants

Do not weaken these without a threat-model note:

- `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `app.enableSandbox()`.
- The preload is transport only. Every capability is a named channel with a zod-validated payload;
  never expose a generic "invoke anything" bridge. Inputs are validated in main (authoritative).
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
    Verified against the real sync API: a GET carrying `Authorization` now reaches the server.
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

The scheme is the same `safely` the deep links use, but the two are different mechanisms: this
handler only serves requests made inside the app's session, while `safely://` URLs coming from the
OS arrive through `open-url` / argv. A deep link therefore has a different host than the app origin
and is refused by the navigation guard — it has to be translated into a route, never navigated to.

Closing the window hides it on macOS instead of destroying the renderer, because the sync engine
lives there; `backgroundThrottling: false` keeps its timers running while hidden. A single instance
lock guarantees one sync engine per machine. Hiding is also where the vault will lock.

The renderer's logger writes to its devtools console, which is invisible when the app is driven from
a terminal, so `src/main/window.ts` forwards renderer console messages, `did-fail-load` and
`render-process-gone` into the main logger. That is how a renderer that dies during boot stays
diagnosable.

## Build

`electron-forge` (7.x) + `vite` (6.x) — `pnpm --filter @safely/desktop start | package | make`.

- `make` produces a **macOS zip only**. Signing and notarisation are not wired yet, and they are a
  prerequisite of the vault rather than a cosmetic step: the hardened runtime is what keeps another
  process out of our memory, and the Secure Enclave needs an embedded provisioning profile with
  `com.apple.application-identifier`. Never add
  `com.apple.security.cs.disable-library-validation` or `get-task-allow` to a production build.

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
