import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../src';
import { createStorage, jsonEncoder } from '../src';
import { identityProjection } from './version-fixtures';
import { isContainerSlot } from '../src/core/slots';
import { stripSlot } from '../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../src/core/versioning/version';

describe('records', () => {
    it('sets and deletes keys', () => {
        const version = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema: z.object({
                        objects: z.record(z.string(), z.number())
                    }),
                    initial: {
                        objects: {
                            key1: 0,
                            key2: 1
                        }
                    },
                    projectUp: identityProjection,
                    projectDown: identityProjection
                },
                hNil
            )
        );

        const storage = createStorage({
            authorId: 'device-1',
            versions: version
        });

        storage.transaction(draft => {
            draft.at('objects').set('key3', 3);
            draft.at('objects').delete('key1');
        });

        expect(storage.read().objects).toEqual({
            key2: 1,
            key3: 3
        });
    });

    it('stores prototype-like keys as data', () => {
        const schema = z.object({
            objects: z.record(
                z.string(),
                z.object({
                    value: z.number()
                })
            )
        });
        const version = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema: schema,
                    initial: {
                        objects: {}
                    },
                    projectUp: identityProjection,
                    projectDown: identityProjection
                },
                hNil
            )
        );

        const storage = createStorage({
            authorId: 'device-1',
            versions: version
        }) as StorageImpl<z.output<typeof schema>>;

        storage.transaction(draft => {
            draft.at('objects').set('__proto__', { value: 1 });
            draft.at('objects').set('constructor', { value: 2 });
            draft.at('objects').set('prototype', { value: 3 });
        });

        const exported = storage.exportSlot();
        const versionSlot = exported.v['1'];
        if (!isContainerSlot(versionSlot)) {
            throw new Error('Expected version slot to be a container');
        }
        const objectsSlot = versionSlot.v.objects;
        if (!isContainerSlot(objectsSlot)) {
            throw new Error('Expected objects slot to be a container');
        }
        expect(Object.getPrototypeOf(objectsSlot.v)).toBeNull();
        expect(Object.prototype.hasOwnProperty.call(objectsSlot.v, '__proto__')).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(objectsSlot.v, 'constructor')).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(objectsSlot.v, 'prototype')).toBe(true);

        const stripped = stripSlot(objectsSlot) as Record<string, { value: number }>;
        expect(stripped.__proto__).toEqual({ value: 1 });
        expect(stripped.constructor).toEqual({ value: 2 });
        expect(stripped.prototype).toEqual({ value: 3 });
        expect(Object.getPrototypeOf(stripped)).toBeNull();
    });

    it('merges JSON-imported prototype-like keys as data', () => {
        const schema = z.object({
            objects: z.record(
                z.string(),
                z.object({
                    value: z.number()
                })
            )
        });
        const version = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema: schema,
                    initial: {
                        objects: {}
                    },
                    projectUp: identityProjection,
                    projectDown: identityProjection
                },
                hNil
            )
        );

        const storage = createStorage({
            authorId: 'device-1',
            versions: version
        }) as StorageImpl<z.output<typeof schema>>;

        const incoming = `{
      "v": {
        "1": {
          "v": {
            "objects": {
              "v": {
                "__proto__": {
                  "s": 1,
                  "v": { "value": { "s": 0, "v": 1, "t": 1, "a": "remote" } },
                  "t": 1,
                  "a": "remote"
                },
                "constructor": {
                  "s": 1,
                  "v": { "value": { "s": 0, "v": 2, "t": 1, "a": "remote" } },
                  "t": 1,
                  "a": "remote"
                },
                "prototype": {
                  "s": 1,
                  "v": { "value": { "s": 0, "v": 3, "t": 1, "a": "remote" } },
                  "t": 1,
                  "a": "remote"
                }
              },
              "s": 1,
              "t": 1,
              "a": "remote"
            }
          },
          "s": 1,
          "t": 0,
          "a": ""
        }
      },
      "s": 1,
      "t": 0,
      "a": ""
    }`;

        storage.withEncoder(jsonEncoder).merge(incoming);

        const exported = storage.exportSlot();
        const versionSlot = exported.v['1'];
        if (!isContainerSlot(versionSlot)) {
            throw new Error('Expected version slot to be a container');
        }
        const objectsSlot = versionSlot.v.objects;
        if (!isContainerSlot(objectsSlot)) {
            throw new Error('Expected objects slot to be a container');
        }

        const stripped = stripSlot(objectsSlot) as Record<string, { value: number }>;
        expect(stripped.__proto__).toEqual({ value: 1 });
        expect(stripped.constructor).toEqual({ value: 2 });
        expect(stripped.prototype).toEqual({ value: 3 });
        expect(Object.getPrototypeOf(stripped)).toBeNull();
    });
});
