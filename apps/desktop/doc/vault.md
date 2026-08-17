# The desktop secret vault (macOS)

**Status: the main-process implementation is in place and runs on a development stub.** The Secure
Enclave module and the signing chain it depends on are not written yet, so nothing here protects
anything until both land — see "Implementation status". The build targets macOS only, and the design
deliberately uses a macOS-only guarantee; "When Windows comes back" records what has to change if
that target returns.

The vault seals every value of the `encrypted` store (`src/main/store/`). The threat it is designed
against is *code running as the user on the same machine*, not a remote attacker.

## The subject is a code signature, not a process

A process has no durable identity: the pid is reused, the path is replaced, the uid is shared with
every other program the user runs. The only identity macOS checks and an attacker cannot forge is the
**code signature**. So "only this app may read the data" means exactly:

> the ability to decrypt is a function of the **code identity** and the **hardware instance**, not of
> owning the files and not of knowing the user's credentials.

Three consequences follow, and they are the design rather than caveats on it:

- a build with a different signature is a **different subject** — patching the bundle removes access
  instead of granting it;
- the same signature on another machine is a different subject, because the key is in this Enclave;
- the same signature on the same machine **tomorrow** is the same subject. A code identity cannot
  separate sessions; only a passcode or a presence check can, and this design uses neither.

## Decisions already taken

- **One factor, not three.** The vault binds to hardware and code identity (F1) and adds neither a
  passcode (F2) nor a user-presence check (F3). What that buys and what it costs is below; both can
  be added later without re-encrypting anything.
- **No migration.** Data written by the removed `safeStorage` implementation is abandoned, not
  converted: the app is pre-release and unsigned, so re-linking the device is cheaper than migration
  code that would be deleted afterwards. A dev profile keeps stale files until they are deleted by
  hand.

## Key schema

```
Secure Enclave key (P-256)
  ├ access control: kSecAccessControlPrivateKeyUsage        (no user presence)
  ├ accessibility:  kSecAttrAccessibleWhenUnlockedThisDeviceOnly
  └ data protection keychain, access group = our application-identifier
        │
        │ SecKeyCreateDecryptedData — silent, no prompt
        ▼
      DEK (32 B) ──AES-256-GCM──▶ values of encrypted.json
                   nonce per value, AAD = version ‖ scope ‖ key
```

The DEK is sealed **directly** to the Enclave's public half. The `K_hw` → KEK → DEK indirection of
earlier drafts existed only to mix a second factor into the wrap; with one factor it buys nothing.

`kSecAttrTokenIDSecureEnclave` and `kSecUseDataProtectionKeychain` are not alternatives and both are
required: the first decides **where the private key lives**, the second decides **who may ask it for
an operation**. On macOS the Enclave is reachable only through the data protection keychain, so the
second is a precondition of the first.

## What carries the protection

1. the private key never leaves the Enclave — copied files have nothing to decrypt;
2. access to the keychain item is decided by our `application-identifier` entitlement, so another
   binary gets `errSecItemNotFound` rather than a promptable dialog;
3. the hardened runtime keeps another process out of our memory once the DEK is unwrapped.

All three are properties of the **signing chain**, not of this code. Without it the module degrades
to the development stub, which protects nothing.

## What it deliberately does not protect

- **Sessions are not separated.** With no passcode and no presence check the app decrypts whenever it
  runs, so the confidentiality of the wallet equals the security of the macOS account: an unattended
  unlocked Mac, or an attacker able to log in as the user, gets the data.
- **A compromised renderer** can ask main for values — the domain crypto runs there. Closing that
  needs the signer in main plus a main-owned confirmation window, not a flag in the store.
- **root with SIP disabled**, kernel compromise, TCC bypass.

What it does close, and closes without a passcode: files copied off the machine (backup, stolen disk,
file-grabbing stealer), the one-shot infostealer, a phished login password, and a patched or
repackaged bundle.

## Adding the missing factors later

Both are re-wraps of an unchanged DEK, so neither is a data migration:

- **presence (F3)** — re-create the Enclave key with `kSecAccessControlUserPresence` and re-seal the
  DEK. `UserPresence` rather than `BiometryCurrentSet` is deliberate: it accepts the login password,
  which is the only way a Mac without Touch ID can use the vault at all.
- **passcode (F2)** — wrap the DEK under `HKDF(scrypt(passcode) ‖ enclave secret)` instead of sealing
  it directly.

F2 must never stand alone. scrypt at 128 MiB costs about 256 MiB of memory traffic per guess, so a
high-end GPU is worth roughly 1–2·10³ guesses/s and a small farm 10⁵/s: a 6-digit passcode (20 bits)
falls in minutes and an 8-digit one in about a day. A memory-hard KDF buys 10–20 bits, which is the
size of the whole secret. The point of combining it with the Enclave is not a stronger passcode but
that offline guessing has nothing to guess against.

## On disk

```
userData/store/vault.json        { v: 1, dek: base64(ECIES(SE_pub, DEK)) }     # metadata, not secret
userData/store/encrypted.json    { <key>: "v1:" + base64(nonce ‖ ct ‖ tag) }   # values under the DEK
userData/store/regular.json      plaintext
```

`AAD = "v1|<scope>|<key>"`. It binds a ciphertext to its own key, its own store and its own format
version: a value moved from `master_key` to `dmk_prv`, or copied into another store, fails
authentication instead of decrypting. The version prefix sits outside the ciphertext so a future
format is recognised without a key.

`vault.json` is written like every store file — temp file → `fsync` → `rename` → `fsync` of the
directory (`src/main/utils/atomic-file.ts`) — because a half-written vault is an unrecoverable
wallet, not a lost setting.

## Flows

| Flow | What happens |
| ---- | ------------ |
| **init** | no `vault.json` → create the Enclave key, generate the DEK, seal it, write the file. An existing vault is left alone **even when it cannot be opened**: re-creating it would silently discard the wallet |
| **encode / decode** | read `vault.json`, ask the hardware to unwrap the DEK into a `using` scope, use it, zero the buffer on the way out |
| **erase** | delete `vault.json` and destroy the Enclave key — every remaining byte is unopenable at once. This is what `clearAllData` becomes |

There is **no lock/unlock**, because there is no cached key to lock: the DEK is unwrapped per
operation and zeroed when the scope it was unwrapped in ends. `DEK` is a `Disposable` whose
`[Symbol.dispose]()` zeroes the material, and every holder declares it with `using` — so the error
path zeroes it too, and a new call site cannot forget a `finally`. Nothing survives between calls, so
window hide, suspend and screen lock need no handling, and the IPC surface gains no channel. Caching
the DEK is the obvious optimisation and is deliberately absent — measure an Enclave round trip before
adding it, and note that a cache re-introduces an unlocked state which then has to be locked
somewhere.

`using` needs `Symbol.dispose` in the type system, and `lib` can only be replaced, not extended: so
`apps/desktop/tsconfig.json` restates the root list plus `ESNext.Disposable`. Nothing is needed at
runtime — the target is ESNext, esbuild lowers the declaration into the try/finally it stands for, and
both Node 24 and Electron have `Symbol.dispose` natively.

## The hardware layer

The boundary with the native world is a directory: `src/main/plugins/hardware-key/` holds the addon's
surface (`types.ts`), its loader, the development stub and an `index.ts` that re-exports them —
nothing else. That port is **the same shape** as the addon, deliberately — so joining them takes no
adapter, and a native module that stops providing what the vault needs fails to compile rather than at
runtime:

```ts
export interface HardwareKey {
    isAvailable(): boolean;
    ensureKey(tag: string): void;
    seal(tag: string, data: Buffer): Buffer;
    open(tag: string, blob: Buffer): Promise<Buffer>;
    destroy(tag: string): void;
}
```

The signatures are not uniform on purpose: `open` is asynchronous because it reaches the enclave, and
the rest are not because they do not. An interface that promised uniformity would be describing
something other than the platform. Nothing is added on top: the port is the addon's own shape, and
which implementation a build got is not a property of the key but of the bundle — the stub says so
itself, with a `warn` on every load.

**The choice between hardware and stub is made by the bundler, not by code.** `vite.main.config.ts`
aliases `secure-enclave` to `secure-enclave.stub` in development, so the code that
uses it never branches, and a packaged bundle does not contain the stub at all — a stronger
guarantee than a runtime check, which could be reached by mistake.

Plugins translate nothing: they surface the platform's own failures, and `Vault` turns any of them
into `VAULT_UNAVAILABLE` with the detail on `cause`. The stub and the enclave therefore fail
identically.

The key is P-256, created with `SecKeyCreateRandomKey` plus `kSecAttrTokenIDSecureEnclave`,
`kSecUseDataProtectionKeychain` and an access control of `kSecAccessControlPrivateKeyUsage`. `seal`
is `SecKeyCreateEncryptedData` against the public half — no hardware, no prompt; `open` is
`SecKeyCreateDecryptedData`, the single operation the Enclave performs. Both use
`eciesEncryptionCofactorVariableIVX963SHA256AESGCM`; do not re-implement that construction in JS.

In the addon itself `open` is an `AsyncWorker` for the same reason it is async in the interface: it
is the one operation on the hot path, and running it on the main thread would stall the Electron main
loop for the length of an ECDH on every store read. The rest happen once per vault.

**`isAvailable()` must probe the keychain, not the Enclave.** Creating a *transient* Enclave key
succeeds in an unsigned build — measured, not assumed — so a probe that only does that reports
`true` where nothing else will work, and the app then picks the hardware path and dies on the first
permanent key. What actually needs the entitlement is the data protection keychain, and only writes
reveal it: reads answer `errSecItemNotFound` with or without it, while `SecItemAdd` answers
`errSecMissingEntitlement` (-34018). The probe therefore adds a throwaway item and deletes it again,
and `isAvailable()` is the conjunction of both checks.

Packaging: an N-API addon in Objective-C++ (Swift would need a C shim for a handful of calls) at
`native/hardware-key`, a workspace package so `pnpm install` builds it. Two things about shipping it
were found the hard way:

- the forge vite plugin makes the packager ignore everything but `.vite`, so `node_modules` never
  reaches the app and the addon cannot be required by package name. It travels as `extraResource`
  into `Contents/Resources` and is loaded from `process.resourcesPath`. An `asar` unpack glob is not
  an alternative: `**/*.node` does not match inside the dot-directory the bundle lives in.
- it needs **no** rebuild for Electron. N-API is ABI-stable, so the binary built against Node loads
  as it is — verified by loading it under Electron, not assumed.

There is no computable part worth a `*Core` type here, unlike the mobile modules: everything except
the platform calls lives in TypeScript and is tested there.

The key tag is tied to the bundle id (`VAULT_KEY_TAG` in `src/main/store/index.ts`). Changing either
abandons the existing vault, because the access group changes with the bundle id and the old key
stops being visible at all.

## Development builds

An unsigned `pnpm start` has no provisioning profile, so the real module cannot work. Development
builds are bundled with the stub plugin instead: the same interface, a key derived from the tag, a
warning on every start. A packaged build has no stub to fall back to and fails to start — sealing
secrets under a constant is worse than the `safeStorage` it replaced, and a silent downgrade in a
shipped build is the failure mode this document exists to prevent.

## Build requirements

The vault cannot ship before the signing milestone, because every guarantee above depends on it:

- explicit App ID and an embedded **Developer ID provisioning profile**;
  `com.apple.application-identifier` is not a string you may simply declare — `amfid` validates it
  against the profile, and without one the data protection keychain and the Enclave do not exist for
  the app, whatever the entitlements say;
- entitlements `com.apple.application-identifier`, `com.apple.developer.team-identifier` and
  `keychain-access-groups` on the **main binary only**: helpers must not get them, so the renderer
  process cannot reach the keychain group even when compromised;
- Developer ID signature, hardened runtime, notarisation; no
  `com.apple.security.cs.disable-library-validation` and no `get-task-allow`, or memory protection
  reopens quietly;
- the existing fuses (`RunAsNode`, inspector, `NODE_OPTIONS` off; asar integrity on).

Verify rather than assume:

```
codesign -d --entitlements :- <app>                                    # application-identifier here
codesign -d --entitlements :- <app>/Contents/Frameworks/*Helper.app    # and not here
security cms -D -i <app>/Contents/embedded.provisionprofile
spctl -a -vvv -t exec <app>
```

The real proof of isolation is a second signed bundle with a different bundle id reading our key tag:
it must get `errSecItemNotFound` with no dialog. That check is manual — it cannot run in CI.

## Failure modes and recovery

| Event | Behaviour |
| ----- | --------- |
| Developer ID certificate rotated within the same team | no effect: access follows the access group, not the certificate |
| bundle id or Team ID changed | permanent loss — a different access group |
| provisioning profile expired | the entitlement stops being honoured for already-installed copies; the highest operational risk here, so check the issued profile's validity before shipping |
| keychain reset, new Mac, logic board replaced | permanent loss — the Enclave key is not portable, by design |
| no Secure Enclave (pre-T2 Intel, VM) | fail closed |
| unsigned dev build ↔ packaged build | different worlds; dev is on the stub |
| `open` fails for any reason | `VAULT_UNAVAILABLE`, and the vault is **never** re-created — recovery is the mnemonic or another device |

Device binding is a property, not a bug, but it makes an external recovery path mandatory: this
storage must never be the only copy of anything, and onboarding has to guarantee a recorded mnemonic
before the vault is relied upon.

## Tests

The vault sits behind `HardwareKey`, so all of it is testable with the stub (`test/main/vault/`): the
format cases exercise `DEK` on its own, the rest go through `Vault`. Round-trip, tampered ciphertext,
AAD swapped between keys and between scopes, unknown format version, truncated payload, a key that
stops working once its `using` scope ended, a corrupt `vault.json`, hardware reporting itself
unavailable, and — the one that matters most — that a vault whose `open` fails is not re-created. The
native part has no unit tests; it has the manual checklist above.

## What was removed, and why it is not coming back

The previous implementation was a `safeStorage` codec plus a Touch ID gate
(`systemPreferences.promptTouchID` minting a 30-second in-memory ticket that secret reads required).

- `promptTouchID` is bound to no key — Electron's own documentation says the API "will not protect
  your user data". Malware never had to defeat it: it reads the store file and calls the keychain
  itself.
- `safeStorage` keeps a 128-bit key in a `<AppName> Safe Storage` keychain entry. The entry is
  ACL-protected, but the ACL is phishable ("an app wants to use your confidential information") and
  bypassable by pre-creating the entry before first run with our app on its ACL — the attack Chromium
  tracks as the Safe Storage key redefinition issue, seen in the wild against Chrome. Its values are
  also AES-128-CBC with no MAC, so whoever can write the file can alter what we read.
- `canPromptTouchID()` is false on any Mac without Touch ID (Mac mini, Studio, an iMac without a
  Touch ID keyboard, pre-T2 Intel), so on those machines the gate closed the store entirely.

## When Windows comes back

The research behind the macOS-only choice, so it does not have to be redone:

- For unpackaged Win32 apps, Windows Hello credentials (`KeyCredentialManager`), TPM keys and DPAPI
  are all scoped to the *user*, not the app — Microsoft confirms any same-user process may open the
  same named credential by design. App-level isolation exists only inside an MSIX AppContainer, which
  an Electron app cannot use.
- Consequences: a phished or keylogged passcode is enough, because malware can obtain the hardware
  half itself; memory protection stays open (the App-Bound Encryption bypasses, most recently
  VoidStealer in 2026, attach a debugger to a hidden browser without admin rights); and there must be
  **no** factor-free unlock.
- What still works: a non-exportable TPM key via NCrypt and the Platform Crypto Provider kills
  offline guessing, and passing a passcode as the key's PIN (`NCRYPT_PIN_PROPERTY`) moves rate
  limiting into the TPM. Its dictionary-attack counter is chip-wide, so our own backoff must trigger
  well before the hardware lockout, and the exact thresholds need measuring.
- Distribution matters as much as crypto: a per-user install directory (the Squirrel default) lets
  malware patch the app without admin rights, so Windows needs a per-machine installer.
- An elevated helper service in the style of Chrome's App-Bound Encryption is not worth building: it
  has been bypassed twice, and the second bypass needs no privileges.

## Implementation status

Done — `src/main/vault/`, `src/main/plugins/hardware-key/` and `native/hardware-key/`, covered by
`test/main/vault/` and `test/main/plugins/`:

- `dek.ts` (the data key and AES-256-GCM with the AAD binding), `vault.ts` (key lifecycle and the
  `vault.json` file), the `HardwareKey` port with its development stub, `secure-enclave.ts` over the
  addon;
- the `encrypted` store is sealed through the vault, and `clearAllData` performs the crypto-erase.

Verified so far: the addon compiles and loads, and on an unsigned build `isAvailable()` answers
`false`, `SecItemDelete` answers -34018 and a key lookup answers -25300 — so the fallback to the
stub is exercised, not assumed. **Everything past that is unverified**: `ensureKey`, `seal` and
`open` against a real permanent key have never run, because that needs a signed build.

Not done, in order:

1. the signing chain above, and with it the first real run of the hardware path plus the manual
   verification checklist;
2. the renderer's `secureEncrypted` layer — a passcode modal over `encryptedStore`, which is where
   the missing factor returns as a product feature, and until it exists the desktop app still cannot
   create or restore an account.
