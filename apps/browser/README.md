# apps/browser — placeholder

Reserved for the browser-extension target (MV3). Intentionally empty: no `package.json` yet, so
pnpm skips this directory while it has no manifest.

## What will live here

The extension build entry and the browser implementation of the platform contract — nothing else:

- **Entry points**: popup (and/or side panel), options page, background service worker, each built by
  Vite from the shared UI.
- **Platform injection**: the browser implementation of the `WebPlatform` interface declared in
  `@safely/web-ui` — storage (IndexedDB / `chrome.storage`), clipboard, external links
  (`chrome.tabs`), locale, app-state, QR scanning.
- **Manifest and packaging**: `manifest.json`, store artefacts, permissions.

## What will not live here

Screens, layout and design-system components. They belong to `@safely/web-ui`, which is shared with
`apps/desktop` and stays platform-independent — the same rule that keeps `@safely/ux` free of
React Native. `eslint-plugin-boundaries` enforces it: `web-ui` may not import app code.

## Constraints to keep in mind before starting

- **MV3 CSP** forbids remote code and `unsafe-eval`. This is one reason the styling layer is
  zero-runtime (Panda): the build must not inject styles at runtime.
- **No privileged process.** Unlike Electron there is no main process, so there is no OS keychain
  (`safeStorage`) and no trusted confirmation window. Secret-at-rest protection has to be solved
  differently (passcode-derived key), and that decision needs its own threat-model entry.
- **Popup lifetime is short.** A popup is destroyed when it closes, so the sync engine only runs
  while a view is open unless it is hosted in the service worker — which MV3 terminates when idle.
- **SSE needs custom headers**, so the native `EventSource` is unusable here as well; the
  `IsomorphicEventSource` implementation from `@safely/web-ui` (the `eventsource` package over
  `fetch`) is reused as is.
