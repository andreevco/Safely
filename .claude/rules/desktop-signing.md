---
paths:
  - 'apps/desktop/signing/**'
  - 'apps/desktop/forge.config.ts'
  - '.github/workflows/desktop-preview.yml'
---

# Signing the desktop app

Signing is what the secret store rests on, not a release formality: its items are reachable only
through the access group a provisioning profile grants, and an unsigned build reports the keychain
unavailable and falls back to the development stub. The entitlements and what they buy are in
`desktop-secret-store.md`; this file is where the profiles and certificates come from.

Both profiles live in `apps/desktop/signing/`, neither is committed, and both name team `3ZVCUSJU6R`
and the explicit App ID `com.safely.wallet-desktop`.

| File | Certificate | Devices | Lives |
| ---- | ----------- | ------- | ----- |
| `dev.provisionprofile` | Apple Development | every registered machine | 365 days |
| `distribution.provisionprofile` | Developer ID Application | none — `ProvisionsAllDevices` | 6570 days (18 years) |

The development profile needs every machine that will run the build registered first — on that
machine `system_profiler SPHardwareDataType | grep "Provisioning UDID"` — then portal → Profiles →
macOS App Development. The distribution one comes from Profiles → Distribution → Developer ID and
needs a Developer ID Application certificate, which **only the Account Holder** can issue: five per
team, and its private key exists in one login keychain, so export the identity as `.p12` into the
team's secret manager or losing the machine burns a slot.

## Building and verifying

```
SAFELY_SIGN_IDENTITY="Developer ID Application: … (3ZVCUSJU6R)" \
SAFELY_SIGN_PROFILE=signing/distribution.provisionprofile \
  pnpm --filter @safely/desktop run package

signing/verify-signature.sh out/Safely-darwin-arm64/Safely.app
```

`SAFELY_SIGN_KEYCHAIN` is passed on to `codesign` and exists for CI's throwaway keychain; unset means
the default search list, which is what a local build wants. What `verify-signature.sh` checks — and
what no script can check — is in `desktop-secret-store.md`.

Notarisation is not wired yet: a Developer ID build is signed and runs, but `spctl` reports
`Unnotarized Developer ID`, so a downloaded copy is refused. Closing that needs an App Store Connect
API key and nothing else.

## QA builds come from CI

`.github/workflows/desktop-preview.yml`, run by hand: Actions → Desktop QA build → Run workflow. It
packages on `macos-15` (arm64, the architecture the addon is built for), signs with the **Apple
Development** identity, runs `verify-signature.sh` as a gate and uploads the zip as an artifact for
14 days.

The Developer ID key deliberately stays off CI. A leaked development certificate is revoked in one
click, burns none of the team's five Developer ID slots, cannot be notarised, and grants the
entitlement only on the machines the profile lists. A leaked Developer ID key is trusted by every Mac
in the world until it is revoked. A development profile is not a release path for the same reasons it
is the one CI gets: releases are a local `distribution.provisionprofile` build plus notarisation.

Three secrets, and they belong to the **`qa-desktop` environment**, not to the repository. Give the
environment a deployment-branch rule (and reviewers, if you want a second pair of eyes): a run on any
other ref then cannot read the certificate at all.

| Secret | Contents |
| ------ | -------- |
| `APPLE_DEV_CERT_P12` | base64 of a `.p12` holding the Apple Development identity **and** the Apple WWDR intermediate |
| `APPLE_DEV_CERT_PASSWORD` | the password the `.p12` was exported with |
| `APPLE_DEV_PROVISIONING_PROFILE` | base64 of a `dev.provisionprofile` listing every QA machine |

Exporting the identity alone leaves `codesign` on the runner unable to build the chain: in Keychain
Access select **both** `Apple Development: …` and the `Apple Worldwide Developer Relations
Certification Authority` it chains to, then File → Export Items → `.p12`.

```
base64 -i AppleDevelopment.p12 | pbcopy            # → APPLE_DEV_CERT_P12
base64 -i signing/dev.provisionprofile | pbcopy    # → APPLE_DEV_PROVISIONING_PROFILE

gh api -X PUT repos/andreevco/Safely/environments/qa-desktop
gh secret set APPLE_DEV_CERT_P12 --env qa-desktop
```

Adding a QA machine: its Provisioning UDID → portal → Devices, regenerate the macOS App Development
profile, re-set `APPLE_DEV_PROVISIONING_PROFILE`. Nothing in the repository changes. Registrations
count against 100 macOS slots per membership year and can only be cleared at renewal, so do not
register machines speculatively.

Installing the artifact:

```
unzip -q Safely-darwin-arm64-*.zip -d /Applications
xattr -dr com.apple.quarantine /Applications/Safely.app
```

Removing the quarantine flag is not optional: a development signature cannot be notarised, so
Gatekeeper refuses a downloaded copy. The Mac has to be listed in the profile — otherwise the
entitlement is not honoured, the store fails closed and the app exits instead of starting on a stub.
