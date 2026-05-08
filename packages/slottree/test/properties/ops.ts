import fc from 'fast-check';
import { z } from 'zod';

import { stressSchema } from './stress-schema';
import type { Draft } from '../../src';

type StressState = z.output<typeof stressSchema>;

type StorageLike = {
    update(fn: (draft: Draft<StressState>) => void): void;
};

const safeString = fc.string({ maxLength: 20 });

const keyArb = fc.constantFrom('a', 'b', 'c');
const nestedKeyArb = fc.constantFrom('x', 'y', 'z');

const scalarArb = safeString;

const richObjectArb = fc.record({
    value: scalarArb,
    nested: fc.record(
        {
            note: scalarArb,
            nullableNote: fc.option(scalarArb, { nil: null })
        },
        {
            requiredKeys: ['nullableNote']
        }
    )
});

const discriminatedItemArb = fc.oneof(
    fc.record({
        type: fc.constant('text' as const),
        value: scalarArb
    }),

    fc.record({
        type: fc.constant('ref' as const),
        refId: scalarArb,
        meta: fc.record({
            label: fc.option(scalarArb, { nil: undefined })
        })
    }),

    fc.record({
        type: fc.constant('empty' as const)
    })
);

const objectStringNullUnionArb = fc.oneof(richObjectArb, scalarArb, fc.constant(null));

const ambiguousUnionArb = fc.oneof(
    fc.record({
        value: scalarArb,
        extra: fc.option(scalarArb, { nil: undefined })
    }),

    fc.record({
        value: scalarArb,
        count: fc.option(scalarArb, { nil: undefined })
    })
);

const arrayOfObjectsArb = fc.array(richObjectArb, { maxLength: 4 });

const arrayOfUnionsArb = fc.array(
    fc.oneof(scalarArb, fc.constant(null), richObjectArb, discriminatedItemArb),
    { maxLength: 4 }
);

const tupleArb = fc.tuple(scalarArb, richObjectArb, fc.option(discriminatedItemArb, { nil: null }));

const catchallValueArb = fc.oneof(
    scalarArb,
    fc.constant(null),
    richObjectArb,
    discriminatedItemArb
);

const deepMixedValueArb = fc.record({
    object: richObjectArb,
    maybeObject: fc.option(richObjectArb, { nil: null }),
    items: fc.array(fc.oneof(richObjectArb, discriminatedItemArb, scalarArb, fc.constant(null)), {
        maxLength: 4
    }),
    children: fc.dictionary(
        nestedKeyArb,
        fc.record({
            item: discriminatedItemArb,
            value: fc.oneof(scalarArb, richObjectArb, fc.constant(null))
        }),
        { maxKeys: 3 }
    )
});

type RichObject = {
    value: string;
    nested: {
        note?: string;
        nullableNote: string | null;
    };
};

type DiscriminatedItem =
    | {
          type: 'text';
          value: string;
      }
    | {
          type: 'ref';
          refId: string;
          meta: {
              label?: string;
          };
      }
    | {
          type: 'empty';
      };

type CatchallValue = string | null | RichObject | DiscriminatedItem;

type DeepMixedValue = StressState['deepMixed'][string];

type Op =
    // 1. Plain nested object
    | { type: 'nested.setValue'; value: string }
    | { type: 'nested.setChildValue'; value: string }

    // 2. Optional object
    | { type: 'optionalObject.set'; value: StressState['optionalObject'] }
    | { type: 'optionalObject.delete' }

    // 3. Nullable object
    | { type: 'nullableObject.set'; value: StressState['nullableObject'] }

    // 4. Optional + nullable object
    | {
          type: 'optionalNullableObject.set';
          value: StressState['optionalNullableObject'];
      }
    | { type: 'optionalNullableObject.delete' }

    // 5. Record<string, object>
    | { type: 'recordOfObjects.setEntry'; key: string; value: RichObject }
    | { type: 'recordOfObjects.deleteEntry'; key: string }

    // 6. Record<string, Record<string, object>>
    | {
          type: 'nestedRecordOfObjects.setEntry';
          outerKey: string;
          innerKey: string;
          value: RichObject;
      }
    | {
          type: 'nestedRecordOfObjects.deleteEntry';
          outerKey: string;
          innerKey: string;
      }
    | { type: 'nestedRecordOfObjects.deleteOuter'; outerKey: string }

    // 7. Record<string, Record<string, object | null>>
    | {
          type: 'nestedRecordOfNullableObjects.setEntry';
          outerKey: string;
          innerKey: string;
          value: RichObject | null;
      }
    | {
          type: 'nestedRecordOfNullableObjects.deleteEntry';
          outerKey: string;
          innerKey: string;
      }

    // 8. Union<object, string, null>
    | {
          type: 'objectStringNullUnion.set';
          value: StressState['objectStringNullUnion'];
      }

    // 9. Discriminated union
    | {
          type: 'discriminatedUnion.set';
          value: StressState['discriminatedUnion'];
      }

    // 10. Nested discriminated union
    | {
          type: 'nestedDiscriminatedUnion.setItem';
          value: StressState['nestedDiscriminatedUnion']['item'];
      }
    | { type: 'nestedDiscriminatedUnion.setId'; value: string }

    // 11. Record<string, discriminated union>
    | {
          type: 'recordOfDiscriminatedUnions.setEntry';
          key: string;
          value: StressState['recordOfDiscriminatedUnions'][string];
      }
    | { type: 'recordOfDiscriminatedUnions.deleteEntry'; key: string }

    // 12. Arrays and tuple
    | { type: 'arrayOfObjects.set'; value: StressState['arrayOfObjects'] }
    | { type: 'arrayOfUnions.set'; value: StressState['arrayOfUnions'] }
    | { type: 'tuple.set'; value: StressState['tuple'] }

    // 13. Ambiguous union
    | { type: 'ambiguousUnion.set'; value: StressState['ambiguousUnion'] }

    // 14. Intersection
    | { type: 'intersectionObject.setId'; value: string }
    | { type: 'intersectionObject.setValue'; value: string }
    | { type: 'intersectionObject.setMetaNote'; value: string }
    | { type: 'intersectionObject.deleteMetaNote' }

    // 15. Catchall
    | { type: 'catchallObject.setKnown'; value: string }
    | { type: 'catchallObject.setExtra'; key: string; value: CatchallValue }
    | { type: 'catchallObject.deleteExtra'; key: string }

    // 17. Partial-like object
    | { type: 'partialObject.setA'; value: string }
    | { type: 'partialObject.deleteA' }
    | {
          type: 'partialObject.setChild';
          value: NonNullable<StressState['partialObject']['child']>;
      }
    | { type: 'partialObject.deleteChild' }

    // 18. Deep mixed
    | { type: 'deepMixed.setEntry'; key: string; value: DeepMixedValue }
    | { type: 'deepMixed.deleteEntry'; key: string }
    | {
          type: 'deepMixed.setChild';
          key: string;
          childKey: string;
          value: DeepMixedValue['children'][string];
      }
    | { type: 'deepMixed.deleteChild'; key: string; childKey: string };

export const opArb = fc.oneof(
    // 1. Plain nested object
    scalarArb.map(value => ({
        type: 'nested.setValue',
        value
    })),

    scalarArb.map(value => ({
        type: 'nested.setChildValue',
        value
    })),

    // 2. Optional object
    richObjectArb.map(value => ({
        type: 'optionalObject.set',
        value
    })),

    fc.constant({
        type: 'optionalObject.delete'
    }),

    // 3. Nullable object
    fc.oneof(richObjectArb, fc.constant(null)).map(value => ({
        type: 'nullableObject.set',
        value
    })),

    // 4. Optional + nullable object
    fc.oneof(richObjectArb, fc.constant(null)).map(value => ({
        type: 'optionalNullableObject.set',
        value
    })),

    fc.constant({
        type: 'optionalNullableObject.delete'
    }),

    // 5. Record<string, object>
    fc
        .record({
            key: keyArb,
            value: richObjectArb
        })
        .map(({ key, value }) => ({
            type: 'recordOfObjects.setEntry',
            key,
            value
        })),

    keyArb.map(key => ({
        type: 'recordOfObjects.deleteEntry',
        key
    })),

    // 6. Nested record
    fc
        .record({
            outerKey: keyArb,
            innerKey: nestedKeyArb,
            value: richObjectArb
        })
        .map(({ outerKey, innerKey, value }) => ({
            type: 'nestedRecordOfObjects.setEntry',
            outerKey,
            innerKey,
            value
        })),

    fc
        .record({
            outerKey: keyArb,
            innerKey: nestedKeyArb
        })
        .map(({ outerKey, innerKey }) => ({
            type: 'nestedRecordOfObjects.deleteEntry',
            outerKey,
            innerKey
        })),

    keyArb.map(outerKey => ({
        type: 'nestedRecordOfObjects.deleteOuter',
        outerKey
    })),

    // 7. Nested record with nullable values
    fc
        .record({
            outerKey: keyArb,
            innerKey: nestedKeyArb,
            value: fc.oneof(richObjectArb, fc.constant(null))
        })
        .map(({ outerKey, innerKey, value }) => ({
            type: 'nestedRecordOfNullableObjects.setEntry',
            outerKey,
            innerKey,
            value
        })),

    fc
        .record({
            outerKey: keyArb,
            innerKey: nestedKeyArb
        })
        .map(({ outerKey, innerKey }) => ({
            type: 'nestedRecordOfNullableObjects.deleteEntry',
            outerKey,
            innerKey
        })),

    // 8. Union<object, string, null>
    objectStringNullUnionArb.map(value => ({
        type: 'objectStringNullUnion.set',
        value
    })),

    // 9. Discriminated union
    discriminatedItemArb.map(value => ({
        type: 'discriminatedUnion.set',
        value
    })),

    // 10. Nested discriminated union
    discriminatedItemArb.map(value => ({
        type: 'nestedDiscriminatedUnion.setItem',
        value
    })),

    scalarArb.map(value => ({
        type: 'nestedDiscriminatedUnion.setId',
        value
    })),

    // 11. Record<string, discriminated union>
    fc
        .record({
            key: keyArb,
            value: discriminatedItemArb
        })
        .map(({ key, value }) => ({
            type: 'recordOfDiscriminatedUnions.setEntry',
            key,
            value
        })),

    keyArb.map(key => ({
        type: 'recordOfDiscriminatedUnions.deleteEntry',
        key
    })),

    // 12. Arrays and tuple
    arrayOfObjectsArb.map(value => ({
        type: 'arrayOfObjects.set',
        value
    })),

    arrayOfUnionsArb.map(value => ({
        type: 'arrayOfUnions.set',
        value
    })),

    tupleArb.map(value => ({
        type: 'tuple.set',
        value
    })),

    // 13. Ambiguous union
    ambiguousUnionArb.map(value => ({
        type: 'ambiguousUnion.set',
        value
    })),

    // 14. Intersection
    scalarArb.map(value => ({
        type: 'intersectionObject.setId',
        value
    })),

    scalarArb.map(value => ({
        type: 'intersectionObject.setValue',
        value
    })),

    scalarArb.map(value => ({
        type: 'intersectionObject.setMetaNote',
        value
    })),

    fc.constant({
        type: 'intersectionObject.deleteMetaNote'
    }),

    // 15. Catchall
    scalarArb.map(value => ({
        type: 'catchallObject.setKnown',
        value
    })),

    fc
        .record({
            key: keyArb,
            value: catchallValueArb
        })
        .map(({ key, value }) => ({
            type: 'catchallObject.setExtra',
            key,
            value
        })),

    keyArb.map(key => ({
        type: 'catchallObject.deleteExtra',
        key
    })),

    // 17. Partial-like object
    scalarArb.map(value => ({
        type: 'partialObject.setA',
        value
    })),

    fc.constant({
        type: 'partialObject.deleteA'
    }),

    fc
        .record(
            {
                c: scalarArb,
                d: fc.option(scalarArb, { nil: null })
            },
            {
                requiredKeys: []
            }
        )
        .map(value => ({
            type: 'partialObject.setChild',
            value
        })),

    fc.constant({
        type: 'partialObject.deleteChild'
    }),

    // 18. Deep mixed
    fc
        .record({
            key: keyArb,
            value: deepMixedValueArb
        })
        .map(({ key, value }) => ({
            type: 'deepMixed.setEntry',
            key,
            value
        })),

    keyArb.map(key => ({
        type: 'deepMixed.deleteEntry',
        key
    })),

    fc
        .record({
            key: keyArb,
            childKey: nestedKeyArb,
            value: fc.record({
                item: discriminatedItemArb,
                value: fc.oneof(scalarArb, richObjectArb, fc.constant(null))
            })
        })
        .map(({ key, childKey, value }) => ({
            type: 'deepMixed.setChild',
            key,
            childKey,
            value
        })),

    fc
        .record({
            key: keyArb,
            childKey: nestedKeyArb
        })
        .map(({ key, childKey }) => ({
            type: 'deepMixed.deleteChild',
            key,
            childKey
        }))
) as fc.Arbitrary<Op>;

export const opsArb = fc.array(opArb, { maxLength: 50 });

export function applyOp(storage: StorageLike, op: Op): void {
    storage.update(draft => {
        switch (op.type) {
            case 'nested.setValue': {
                draft.at('nested').set('value', op.value);
                return;
            }

            case 'nested.setChildValue': {
                draft.at('nested').at('child').set('value', op.value);
                return;
            }

            case 'optionalObject.set': {
                if (op.value === undefined) {
                    draft.delete('optionalObject');
                } else {
                    draft.set('optionalObject', op.value);
                }
                return;
            }

            case 'optionalObject.delete': {
                draft.delete('optionalObject');
                return;
            }

            case 'nullableObject.set': {
                draft.set('nullableObject', op.value);
                return;
            }

            case 'optionalNullableObject.set': {
                if (op.value === undefined) {
                    draft.delete('optionalNullableObject');
                } else {
                    draft.set('optionalNullableObject', op.value);
                }
                return;
            }

            case 'optionalNullableObject.delete': {
                draft.delete('optionalNullableObject');
                return;
            }

            case 'recordOfObjects.setEntry': {
                draft.at('recordOfObjects').set(op.key, op.value);
                return;
            }

            case 'recordOfObjects.deleteEntry': {
                draft.at('recordOfObjects').delete(op.key);
                return;
            }

            case 'nestedRecordOfObjects.setEntry': {
                draft.at('nestedRecordOfObjects').at(op.outerKey).set(op.innerKey, op.value);
                return;
            }

            case 'nestedRecordOfObjects.deleteEntry': {
                const outer = draft.at('nestedRecordOfObjects').at(op.outerKey);
                if (outer.get() !== undefined) {
                    outer.delete(op.innerKey);
                }
                return;
            }

            case 'nestedRecordOfObjects.deleteOuter': {
                draft.at('nestedRecordOfObjects').delete(op.outerKey);
                return;
            }

            case 'nestedRecordOfNullableObjects.setEntry': {
                draft
                    .at('nestedRecordOfNullableObjects')
                    .at(op.outerKey)
                    .set(op.innerKey, op.value);
                return;
            }

            case 'nestedRecordOfNullableObjects.deleteEntry': {
                const outer = draft.at('nestedRecordOfNullableObjects').at(op.outerKey);
                if (outer.get() !== undefined) {
                    outer.delete(op.innerKey);
                }
                return;
            }

            case 'objectStringNullUnion.set': {
                draft.set('objectStringNullUnion', op.value);
                return;
            }

            case 'discriminatedUnion.set': {
                draft.set('discriminatedUnion', op.value);
                return;
            }

            case 'nestedDiscriminatedUnion.setItem': {
                draft.at('nestedDiscriminatedUnion').set('item', op.value);
                return;
            }

            case 'nestedDiscriminatedUnion.setId': {
                draft.at('nestedDiscriminatedUnion').set('id', op.value);
                return;
            }

            case 'recordOfDiscriminatedUnions.setEntry': {
                draft.at('recordOfDiscriminatedUnions').set(op.key, op.value);
                return;
            }

            case 'recordOfDiscriminatedUnions.deleteEntry': {
                draft.at('recordOfDiscriminatedUnions').delete(op.key);
                return;
            }

            case 'arrayOfObjects.set': {
                draft.set('arrayOfObjects', op.value);
                return;
            }

            case 'arrayOfUnions.set': {
                draft.set('arrayOfUnions', op.value);
                return;
            }

            case 'tuple.set': {
                draft.set('tuple', op.value);
                return;
            }

            case 'ambiguousUnion.set': {
                draft.set('ambiguousUnion', op.value);
                return;
            }

            case 'intersectionObject.setId': {
                draft.at('intersectionObject').set('id', op.value);
                return;
            }

            case 'intersectionObject.setValue': {
                draft.at('intersectionObject').set('value', op.value);
                return;
            }

            case 'intersectionObject.setMetaNote': {
                draft.at('intersectionObject').at('meta').set('note', op.value);
                return;
            }

            case 'intersectionObject.deleteMetaNote': {
                draft.at('intersectionObject').at('meta').delete('note');
                return;
            }

            case 'catchallObject.setKnown': {
                draft.at('catchallObject').set('known', op.value);
                return;
            }

            case 'catchallObject.setExtra': {
                draft.at('catchallObject').set(op.key, op.value);
                return;
            }

            case 'catchallObject.deleteExtra': {
                if (op.key !== 'known') {
                    draft.at('catchallObject').delete(op.key);
                }
                return;
            }

            case 'partialObject.setA': {
                draft.at('partialObject').set('a', op.value);
                return;
            }

            case 'partialObject.deleteA': {
                draft.at('partialObject').delete('a');
                return;
            }

            case 'partialObject.setChild': {
                draft.at('partialObject').set('child', op.value);
                return;
            }

            case 'partialObject.deleteChild': {
                draft.at('partialObject').delete('child');
                return;
            }

            case 'deepMixed.setEntry': {
                draft.at('deepMixed').set(op.key, op.value);
                return;
            }

            case 'deepMixed.deleteEntry': {
                draft.at('deepMixed').delete(op.key);
                return;
            }

            case 'deepMixed.setChild': {
                draft.at('deepMixed').set(op.key, {
                    object: {
                        value: '',
                        nested: {
                            nullableNote: null
                        }
                    },
                    maybeObject: null,
                    items: [],
                    children: {}
                });
                draft.at('deepMixed').at(op.key).at('children').set(op.childKey, op.value);
                return;
            }

            case 'deepMixed.deleteChild': {
                const entry = draft.at('deepMixed').at(op.key);
                if (entry.get() !== undefined) {
                    entry.at('children').delete(op.childKey);
                }
                return;
            }
        }
    });
}

export function applyOps(storage: StorageLike, ops: Op[]): void {
    for (const op of ops) {
        applyOp(storage, op);
    }
}
