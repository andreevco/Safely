---
paths:
  - 'apps/mobile/**/*'
---

# `apps/mobile` — Expo dev-client

The app runs as a **dev-client** only (`pnpm --filter mobile ios|android`), never in Expo Go,
because it ships its own native modules. `pnpm --filter mobile start` serves an already installed
client. If native dependencies or the config changed, rebuild the dev-client — `start` alone won't
pick it up.

Expo configuration is `app.config.js` (the version is read from `package.json`, so version bumps
happen there). The config plugin `plugins/withMMKVNoBackup.js` and the `shims/`
(`isomorphic-webcrypto` in particular) are wired from there and from `metro.config.js`; RN polyfills
live in `global-polyfills.ts`.

## Native modules

Local Expo modules live in `modules/`; a module's JS facade is always `modules/<name>/src/index.ts`,
and the platforms it actually ships are in its `expo-module.config.json`:

| Module                      | What it provides                                                                  |
| --------------------------- | --------------------------------------------------------------------------------- |
| `safely-crypto`             | `pbkdf2Sha512` on the platform crypto libs (CommonCrypto / JCE)                    |
| `safely-secure-store-enum`  | what `expo-secure-store` lacks: list keys, list by prefix, clear, delete by prefix |
| `safely-store-country`      | App Store / Play storefront country code (`getStoreCountryAsync`)                  |
| `safely-in-app-browser`     | `SFSafariViewController` / Android Custom Tabs                                     |
| `safely-masked-input`       | `MaskedInput` — native amount input with decimal masking                           |
| `safely-capture-prevention` | `CapturePreventionView` — hides its subtree from screenshots                       |

`safely-capture-prevention` is the exception: `platforms: ["ios"]`, no `android/` at all — the facade
swaps in an `expo-screen-capture` based component on Android. Everything else is iOS + Android.

`safely-crypto` and `safely-store-country` are arranged so the core is testable without Xcode or the
Android SDK: pure logic sits in a `*Core` type (`ios/Pbkdf2Core/Pbkdf2Core.swift`,
`ios/CountryCodeCore/CountryCodeCore.swift`, the `*Core.kt` files) reachable through a host-only
SwiftPM package (`ios/Package.swift`) or Gradle harness, while the Expo module wrappers only call
into it. Write new native logic the same way: computation in a `*Core` type, platform calls in the
module. Host tests:

```
cd apps/mobile/modules/safely-crypto/ios && swift test
cd apps/mobile/modules/safely-crypto/android/host-test && ./gradlew test
cd apps/mobile/modules/safely-store-country/ios && swift test
```

CI (`swift-core-tests`, `kotlin-core-tests`) runs only the two `safely-crypto` ones whenever a PR
touches `apps/mobile/**` — `safely-store-country`'s Swift tests are local-only, so run them by hand
when you touch that module.

## UI

- Styling is `react-native-unistyles`. The token values live in `@safely/ux/theme` — shared with the
  web targets — and `src/shared/unistyles` only feeds them to `StyleSheet.configure` (currently only
  `dark`, which is also the initial theme). Take colors and spacing from the theme instead of
  hardcoding them, and edit the values in `packages/ux/src/shared/theme`, not here.
- A screen is a directory under `src/screens`; navigation and providers live in `src/app`
  (`AppNavigation.tsx`, `AppContext.tsx`, `root-error-boundary`, `root-suspense`).
- Layers and the `@mobile/*` aliases: see `fsd-layers.md`.

## i18n

The strings live in `@safely/ux/translations` (`packages/ux/src/shared/i18n/translations/`), shared
with the web targets; `src/shared/i18n` only creates the i18next instance and detects the language.
The source of strings is `en.json`; the other locale files are produced by translation and are not
edited by hand. Add new copy to `en.json` and read it through `useTranslate()`. Supported locales are
also listed in `app.config.js` (`CFBundleLocalizations`) — update it when adding a language.

## Build and release

- EAS profiles are in `eas.json` (`staging-base`, `staging-cached`, `production`; build numbers come
  from `appVersionSource: remote`).
- Tester distribution runs through the EAS Workflow `.eas/workflows/build-and-distribute.yml`;
  trigger it locally with `pnpm --filter mobile run build`. Read that file's comments before editing
  it — EAS Workflows has sharp edges the syntax doesn't hint at:
  - `env:` must be job-level. A step-level `env:` is unsupported and its `${{ }}` values arrive as
    raw literals; interpolate inside `run:` instead, or put the value on the job.
  - a custom `steps:` job starts with an empty working dir — `- uses: eas/checkout` first, otherwise
    committed files are missing. After checkout, cwd is the Expo project root (`apps/mobile`), so
    reference scripts project-relative (`scripts/eas-report.mjs`).
  - EAS doesn't quote-safely interpolate values into its internal bash: unescaped `` ( ) ` $ " ' \ ``
    in a changelog cause exit 141 / empty logs, which is why the workflow strips them up front.
- Icons: `pnpm --filter mobile run icons` (`scripts/generate-icons-file.js`); the generated file is
  not hand-edited.
