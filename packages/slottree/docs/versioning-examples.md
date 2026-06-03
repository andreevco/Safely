# Versioning Patch Examples

`patch(fromSchema, toSchema, draft => ...)` mutates a cloned slot tree and validates the result against `toSchema`.

Paths are arrays of object keys. The empty path `[]` means the current draft root.

```ts
import { patch } from '@safely/slottree';
```

## Rename A Field

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.rename([], 'name', 'displayName')
);
```

Nested field:

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.rename(['profile'], 'name', 'displayName')
);
```

`rename` moves the existing slot inside the same container, so the renamed field keeps its original timestamp and author.

## Delete A Field

Important: Deleting a field does not create a tombstone. In fact, there is no way to create a tombstone when patching.
This is intentional: patches must not modify **data**, they only modify **structure**.

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.deleteField([], 'legacyFlag')
);
```

Nested field:

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.deleteField(['settings'], 'legacyFlag')
);
```

`deleteField` physically removes the field from the container.

## Add A New Field

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.newField([], 'createdAt', 0)
);
```

Nested field:

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.newField(['settings'], 'theme', 'light')
);
```

`newField` fails if the field already exists. New slots are created with origin metadata: timestamp `0`, author `''`.

## Update A Field Value

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.update(['counter'], counter => counter + 1)
);
```

Convert a field:

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.update(['age'], age => String(age))
);
```

`update` writes a new value at the same path. If the old slot exists, the new slot keeps the old timestamp and author.

## Move A Field Into Nested Object

From:

```ts
type V1 = {
    a: boolean;
};
```

To:

```ts
type V2 = {
    b: {
        a: boolean;
    };
};
```

Patch:

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.newField([], 'b', {}).move(['a'], ['b', 'a'])
);
```

`move` transfers the raw slot, so `b.a` keeps the timestamp and author from the old `a`.

`move` does not create containers implicitly. The target parent must already exist, so `b` is created explicitly with `newField`.

## Move A Field Up

From:

```ts
type V1 = {
    b: {
        a: boolean;
    };
};
```

To:

```ts
type V2 = {
    a: boolean;
};
```

Patch:

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.move(['b', 'a'], ['a']).deleteField([], 'b')
);
```

`a` keeps the timestamp and author from `b.a`. `b` is removed after the move.

## Patch Each Array Item

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.updateEach(['items'], item =>
        item.rename([], 'name', 'title').newField([], 'enabled', true)
    )
);
```

`updateEach` works with ordered array slots. The callback receives a draft focused on each item value.

## Patch Each Record Value

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.updateEach(['users'], user =>
        user.deleteField([], 'legacyId').newField([], 'active', true)
    )
);
```

For record-like object slots, `updateEach` iterates over live child slots and passes each child value draft to the callback.

## Patch Nested Collections

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.updateEach(['portfolios'], portfolio =>
        portfolio.updateEach(['derivations'], derivation =>
            derivation
                .newField([], 'newField', 0)
                .deleteField([], 'oldField')
                .update(['counter'], counter => counter + 1)
        )
    )
);
```

## Patch Only One Union Branch

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft.updateEach(['portfolios'], portfolio =>
        portfolio.when(['type'], 'BIP39', bip39 =>
            bip39.updateEach(['derivations'], derivation =>
                derivation.newField(['chains', 'btc'], 'newField', '')
            )
        )
    )
);
```

`when(path, value, map)` applies `map` only when the current draft value at `path` equals `value`.

## Combine Multiple Operations

```ts
const projectUp = patch(v1Schema, v2Schema, draft =>
    draft
        .rename([], 'portfolios', 'accounts')
        .newField([], 'meta', {})
        .move(['analyticsId'], ['meta', 'analyticsId'])
        .deleteField([], 'legacyState')
        .updateEach(['accounts'], account =>
            account.when(['type'], 'BIP39', bip39 =>
                bip39.newField([], 'imported', false)
            )
        )
);
```

The order matters. For example, `move(['analyticsId'], ['meta', 'analyticsId'])` requires `meta` to exist first.
