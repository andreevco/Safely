# Slot Tree Specification

## Slot Tree   

A Slot Tree is a tree-shaped data structure whose nodes are slots.

The root slot MUST be a Container slot. The root slot MUST be an origin slot and MUST NOT be replaced by an Atomic slot, 
OrderedArray slot, or Tombstone during a valid merge.

Slot Tree whose root slot is not an origin Container slot is invalid.

## Author

An Author is an entity that owns and mutates a Slot Tree replica. Each Author is identified by an `AuthorId`, which is 
a byte sequence of arbitrary length.

An Author can create and update slots, but it cannot delete them directly. Deletion is represented by replacing a slot 
with a Tombstone.

A single Slot Tree MAY be managed by multiple Authors.

`AuthorId` values are compared lexicographically as unsigned byte sequences. If one byte sequence is a prefix of 
another, the shorter sequence is considered smaller.

The empty `AuthorId` is reserved for origin slots and MUST NOT be used by real Authors.

The same `AuthorId` MUST NOT be used by multiple independent logical clocks concurrently.

## Slots

A Slot is an object that contains a stamp and a value.

Slot values are untyped. The value type MAY change during an edit or during a valid merge.

Slots are mutable but non-deletable. If a slot should be marked as absent, it MUST be replaced with a Tombstone.

## Slot Stamp

A Slot Stamp identifies a particular version of a slot. It contains an `AuthorId` and a `Timestamp`.

`AuthorId` is the byte sequence identifying the Author that created this version of the slot.

`Timestamp` is a Unix timestamp in seconds, interpreted as a logical timestamp according to the rules in the Time 
section.

Whenever an Author replaces or directly updates a slot, a new stamp MUST be assigned to that slot.

For recursive slots, updates to child slots MUST NOT change the parent slot stamp. Updating, adding, or tombstoning a 
child slot inside a Container or OrderedArray MUST NOT change the stamp of the parent recursive slot. The parent stamp 
identifies the recursive slot itself, not the transitive contents of its children.

## Time

Each Slot Tree replica maintains its own last logical timestamp.

When a new timestamp is required, the replica MUST use the following procedure:

- Read the current physical Unix timestamp in seconds.
- If the physical timestamp is greater than the last logical timestamp, use the physical timestamp as the base timestamp.
- If the physical timestamp is less than or equal to the last logical timestamp, use the last logical timestamp as the
base timestamp.
- Add `1` to the base timestamp.
- Store the result as the new last logical timestamp.
- Use the result as the new slot timestamp.

After observing incoming timestamps during merge, the local last logical timestamp MUST be set to the maximum of the 
current local last logical timestamp and the maximum observed incoming timestamp.

## Slot Types

### Atomic

An Atomic slot contains a single valid JSON value.

The value MAY be a string, number, boolean, null, array, or object. Arrays and objects inside Atomic slots are opaque 
values and are not recursively merged.

### Container

A Container slot contains a key-value map of slots. Each key is a string, and each value is a slot.

Container slots are recursive slots.

### Tombstone

A Tombstone slot indicates that a slot is known to have been removed.

A slot replaced by a Tombstone CAN be resurrected by a newer non-Tombstone slot. The resurrecting slot CAN be of any 
valid slot type.

Old data contained in a slot replaced by a Tombstone is lost and cannot be recovered through merge.

### OrderedArray

An OrderedArray is a recursive slot that stores items in a key-value map. Each key identifies one array item. 
OrderedArray items MUST be addressed by key. The order index is used only to derive the ordered view.

Each non-Tombstone OrderedArray item MUST be a Container slot with exactly the following child slots:

- `order`, an Atomic slot containing the order index.
- `value`, a slot containing the item value.

The order index is a 32-bit integer. The `order` child slot MUST be an Atomic slot containing a 32-bit integer.

The `value` child slot MAY be Atomic, Container, or OrderedArray. The `value` child slot MUST NOT be Tombstone.

Item order is merged as the `order` child slot of the item Container. Item value is merged as the `value` child slot 
of the item Container.

Updating, adding, tombstoning, or moving items inside an OrderedArray MUST NOT change the stamp of the OrderedArray 
slot.

Updating an item `order` child slot or `value` child slot MUST NOT change the stamp of the item Container. The item 
Container stamp identifies the existence and type of the item itself, not its current order or value.

When an item is deleted, the item Container slot MUST be replaced with a Tombstone.

When an item is added, it MUST be assigned a new order index.

A non-Tombstone item Container MUST contain both a valid `order` child slot and a valid `value` child slot.

An item Container is invalid if any of the following is true:

- It does not contain a valid `order` child slot.
- It does not contain a valid `value` child slot.
- It contains a Tombstone `order` child slot and a non-Tombstone `value` child slot.
- It contains a Tombstone `value` child slot and a non-Tombstone `order` child slot.
- Its `order` child slot is not an Atomic slot containing a 32-bit integer.
- Its `value` child slot is a Tombstone.
- It contains child slots other than `order` and `value`.

An incoming Slot Tree that contains an invalid OrderedArray item is invalid.

Only valid non-Tombstone item Containers are included in the ordered view.

Items are sorted by order index in ascending order. Different items MAY have the same order index after concurrent 
operations. If two or more items have the same order index, they are sorted by lexicographical order of their keys.

Moving an item means updating its `order` child slot. Updating an item `order` MUST NOT update the stamp of the item 
`value`. Updating an item `value` MUST NOT update the stamp of the item `order`.

## Origin Slot

An origin slot is any slot whose `Timestamp` is `0` and whose `AuthorId` is the empty byte sequence.

A slot of any type MAY be an origin slot.

The origin stamp is the minimum possible stamp. Any non-origin slot with a timestamp greater than `0` is newer than 
an origin slot.

For a given schema, all origin slots at the same path MUST have the same type and value.

## Merge Protocol

A Slot Tree merge is a deterministic operation that merges an incoming Slot Tree into a local Slot Tree.

Before merging slot values, the merge operation MUST observe all timestamps from the incoming Slot Tree. This includes 
every slot in the incoming tree and every nested slot inside recursive slots.

For OrderedArray, observed timestamps include timestamps of item Container slots, `order` child slots, `value` child 
slots, and all nested slots inside recursive `value` child slots.

After all incoming timestamps have been observed, the local logical clock MUST be updated to at least the maximum 
observed incoming timestamp.

## Slot Ordering

Two slots are ordered by their slot stamps.

If two slots have different timestamps, the slot with the greater timestamp is newer.

If two slots have the same timestamp but different `AuthorId` values, the slot with the lexicographically greater 
`AuthorId` is newer.

If two slots have the same timestamp and the same `AuthorId`, the slots have equal stamps.

Two slots with equal stamps MUST represent the same slot version.

If two non-recursive slots have equal stamps but different type or value, the input is invalid and merge behavior is 
undefined.

If two recursive slots have equal stamps, they MUST have the same slot type. Their child values MAY differ and MUST 
be merged recursively according to the merge algorithm.

This ordering defines the conflict resolution rule: the newer slot wins.

## Recursive Slots

A recursive slot is a slot that contains nested slots. Container and OrderedArray slots are recursive slots.

A recursive slot's own stamp determines the existence and type of that recursive slot. Child stamps do not make the 
parent slot newer.

If a recursive slot is replaced by a newer Tombstone, the entire subtree is removed, even if some descendant slots 
have timestamps greater than the Tombstone timestamp.

## Merge Algorithm

To merge an incoming slot into a local slot, apply the following rules.

1. If both slots are recursive slots, both slots have the same slot type, and both slots have equal stamps, their child 
values MUST be merged recursively.
2. When recursively merging child values, every key present in the incoming recursive slot is processed independently.
3. If a key exists only in the incoming slot, the incoming child slot MUST be cloned and added to the local slot.
4. If a key exists in both the local slot and the incoming slot, the local child slot and the incoming child slot 
MUST be merged using the same merge algorithm.
5. Keys that exist only in the local slot MUST be preserved.
6. If the slots cannot be recursively merged, the incoming slot MUST replace the local slot only if the incoming slot 
is newer than the local slot according to the slot ordering rule.
7. If the incoming slot is not newer than the local slot, the local slot MUST be preserved unchanged.

## Replacement

When a slot is replaced, the entire local slot MUST be replaced by a clone of the incoming slot.

Replacement is not a recursive field-level merge. It replaces the slot type, stamp, and value completely.

## Tombstones

Tombstones MUST be preserved during merge unless they are replaced by a newer non-Tombstone slot according to the 
slot ordering rule.

A missing key means that the local Slot Tree has no information about that slot.

A key mapped to a Tombstone means that the slot is known to have been removed by a specific slot version.
