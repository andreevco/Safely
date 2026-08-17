# Signing inputs

The vault does nothing without these: a Secure Enclave key lives in the data protection keychain,
which is reachable only through the access group a provisioning profile grants. An unsigned build
reports no hardware and falls back to the development stub — see `../doc/vault.md`.

`dev.provisionprofile` is **not committed** and has to be produced once per machine:

1. Apple Developer portal → an explicit App ID `com.safely.wallet-desktop` under team `3ZVCUSJU6R`.
2. Register this Mac. Its identifier:
   `system_profiler SPHardwareDataType | grep "Provisioning UDID"`.
3. Create a **Mac Development** profile for that App ID, including your Apple Development
   certificate and this device. Download it here as `dev.provisionprofile`.

Then:

```
SAFELY_SIGN=1 pnpm --filter @safely/desktop run package
SAFELY_VAULT_SELFTEST=1 out/Safely-darwin-*/Safely.app/Contents/MacOS/Safely
```

The self-test runs the whole hardware path — create the key, seal, open, erase — against its **own**
key tag and file, so it can never touch a real vault. It prints the hardware kind and the cost of one
unwrap, which is the number the DEK-cache decision needs.

Verify the signature did what it claims:

```
codesign -d --entitlements :- out/Safely-darwin-*/Safely.app
codesign -d --entitlements :- out/Safely-darwin-*/Safely.app/Contents/Frameworks/*Helper.app
security cms -D -i out/Safely-darwin-*/Safely.app/Contents/embedded.provisionprofile
```

`application-identifier` must be present on the first and absent on the second.

**A development profile is not a release path.** It normally carries `get-task-allow`, so another
process can read our memory once the data key is unwrapped — fine for making the hardware path run,
useless as protection. Shipping needs a Developer ID certificate, hardened runtime and notarisation.
