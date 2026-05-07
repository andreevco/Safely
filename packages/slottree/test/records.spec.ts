import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../src';
import { createStorage } from '../src';
import { identityProjection } from './version-fixtures';
import { isContainerSlot, type ContainerSlot } from '../src/core/slots';
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

        storage.update(draft => {
            draft.objects.key3 = 3;
            delete draft.objects.key1;
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

        storage.update(draft => {
            draft.objects.__proto__ = { value: 1 };
            draft.objects.constructor = { value: 2 };
            draft.objects.prototype = { value: 3 };
        });

        const exported = storage.exportSlot() as ContainerSlot;
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
                  "v": { "value": { "v": 1, "t": 1, "a": "remote" } },
                  "t": 1,
                  "a": "remote",
                  "r": true
                },
                "constructor": {
                  "v": { "value": { "v": 2, "t": 1, "a": "remote" } },
                  "t": 1,
                  "a": "remote",
                  "r": true
                },
                "prototype": {
                  "v": { "value": { "v": 3, "t": 1, "a": "remote" } },
                  "t": 1,
                  "a": "remote",
                  "r": true
                }
              },
              "t": 1,
              "a": "remote",
              "r": true
            }
          },
          "t": 0,
          "a": "",
          "r": true
        }
      },
      "t": 0,
      "a": "",
      "r": true
    }`;

        storage.merge(incoming);

        const exported = storage.exportSlot() as ContainerSlot;
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
