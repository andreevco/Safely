---
paths:
  - 'packages/sync/**/*.ts'
  - 'packages/slottree/**/*.ts'
  - 'packages/sync-storage/**/*.ts'
---

# Sync, state format and cryptography

This is the riskiest part of the repository: a mistake here doesn't break the current session, it
breaks cross-device compatibility or user privacy. The format and the protocol are specified —
change the spec and the code together, never the code alone.

- `packages/sync/doc/spec.md` — key hierarchy, offline/online account creation, device onboarding and
  reconnect, device list and its signatures, snapshots and proofs, server validation, SSE stream.
- `packages/sync/doc/threat-model.md` — what compromise of each key means, trust boundaries, known
  limitations (notably device revocation) and what is out of scope.
- `packages/slottree/docs/spec.md` — slot types, stamps (author + time), merge protocol;
  `implementation.md` and `versioning-examples.md` cover the implementation and versioning examples.

## Invariants

- The server only ever sees ciphertext and metadata. Nothing decrypted goes into API calls,
  analytics or logs; keys and secrets must not leak through error messages (`filterSensitiveData`).
- Cryptography comes from `@noble/*` and `@scure/*` via `catalog:` (hashes, curves, ciphers, bip32,
  bip39, btc-signer). Don't write your own primitives, key encodings or KDFs.
- On-device secret encryption goes through `ISecretEncryptor` (`packages/core/src/di`), i.e. the
  platform's secure storage — not JS-side constants.
- slottree's cbor encoding is deterministic: changing the encoding or field order changes merge
  results and hashes. That is a new format version, not an in-place edit.
- User-state schemas are versioned: `packages/sync-storage/src/v1` … `v4`, and `actual-version.ts`
  re-exports the newest one. A new field or a different shape means a new version plus a migration
  plus migration tests; older versions must stay readable.
- A downgrade projection patches the entries of a record, never the record itself: `update` on the
  whole field rebuilds the subtree, which drops tombstones (a revoked device reappears) and flattens
  the child stamps, so later edits stop winning the merge. `updateEach` throws on a `null` field —
  guard a nullable record with `when`.
- A value the older schema cannot express is mapped onto the nearest one it can, not dropped: v4
  projects the desktop platforms of `devicesMeta` onto the mobile ones of v3, because an app on the
  older version must still see the device in its list and be able to revoke it.
- `packages/sync/src/api/generated/**` is the generated OpenAPI client (`apis/`, `models/`,
  `runtime.ts`). Hand edits get overwritten — change the API spec/generation instead, and keep
  wrappers and domain logic outside `generated/`.
- Sync lifecycle logic is the xstate machine in `packages/sync/src/sync-machine`; add behaviour as a
  state/transition, not as an external flag.

## Tests

Merge and versioning are covered by property-based tests (fast-check) in
`packages/slottree/test/properties/**`. After changing slottree or sync-storage, run the whole
package's suite (`pnpm --filter @safely/slottree run test`), not just the file you touched — the
invariants cross-check each other.
