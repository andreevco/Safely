import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../src';
import { createStorage } from '../src';
import { SlotKind, type ContainerSlot } from '../src/core/slots';
import { cloneSlot } from '../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../src/core/versioning/version';

const schema = z.object({
    count: z.number(),
    title: z.string(),
    users: z.record(
        z.string(),
        z.object({
            name: z.string(),
            active: z.boolean().optional()
        })
    ),
    flags: z.record(z.string(), z.boolean()),
    settings: z.object({
        theme: z.string(),
        layout: z.string().optional()
    })
});

const versions = defineVersionHList(
    hCons(
        {
            version: 1,
            schema,
            initial: {
                count: 0,
                title: 'initial',
                users: {},
                flags: {},
                settings: {
                    theme: 'light'
                }
            },
            projectUp: cloneSlot,
            projectDown: cloneSlot
        },
        hNil
    )
);

type ReadonlyUser = {
    readonly name: string;
    readonly active?: boolean | undefined;
};

type ReadonlyNullableUser = {
    readonly name: string;
};

function createTestStorage() {
    return createStorage({
        authorId: 'device-1',
        versions
    });
}

const nullableSchema = z.object({
    users: z
        .record(
            z.string(),
            z.object({
                name: z.string()
            })
        )
        .nullable(),
    title: z.string().nullable()
});

const nullableVersions = defineVersionHList(
    hCons(
        {
            version: 1,
            schema: nullableSchema,
            initial: {
                users: null,
                title: null
            },
            projectUp: cloneSlot,
            projectDown: cloneSlot
        },
        hNil
    )
);

function createNullableStorage() {
    return createStorage({
        authorId: 'device-1',
        versions: nullableVersions
    });
}

function expectAssignable<T>(_value: T): void {
    return undefined;
}

describe('Draft', () => {
    it('sets, deletes, and reads nested object fields', () => {
        const storage = createTestStorage();

        storage.transaction(draft => {
            const users = draft.at('users');

            users.set('alice', { name: 'Alice', active: true });
            users.set('bob', { name: 'Bob' });
            users.delete('alice');

            expect(users.get()).toEqual({
                bob: {
                    name: 'Bob'
                }
            });
            draft.at('settings').set('layout', 'dense');
        });

        expect(storage.read()).toEqual({
            count: 0,
            title: 'initial',
            users: {
                bob: {
                    name: 'Bob'
                }
            },
            flags: {},
            settings: {
                theme: 'light',
                layout: 'dense'
            }
        });
    });

    it('supports explicit nested writes', () => {
        const storage = createTestStorage();

        storage.transaction(draft => {
            draft.at('settings').set('theme', 'dark');
            draft.at('settings').set('layout', 'compact');
            draft.at('users').set('carol', { name: 'Carol', active: true });
            draft.at('flags').set('ready', true);

            expect(draft.at('users').entry('carol').unwrap().get()).toEqual({
                name: 'Carol',
                active: true
            });
        });

        expect(storage.read()).toEqual({
            count: 0,
            title: 'initial',
            users: {
                carol: {
                    name: 'Carol',
                    active: true
                }
            },
            flags: {
                ready: true
            },
            settings: {
                theme: 'dark',
                layout: 'compact'
            }
        });
    });

    it('creates a tombstone through delete', () => {
        const storage = createTestStorage() as StorageImpl<z.output<typeof schema>>;

        storage.transaction(draft => {
            draft.at('settings').set('layout', 'compact');
        });
        storage.transaction(draft => {
            draft.at('settings').delete('layout');
        });

        expect(storage.read()).toEqual({
            count: 0,
            title: 'initial',
            users: {},
            flags: {},
            settings: {
                theme: 'light'
            }
        });

        const exported = storage.exportSlot() as ContainerSlot;
        const versionSlot = exported.v['1'] as ContainerSlot;
        const settingsSlot = versionSlot.v.settings as ContainerSlot;

        expect(settingsSlot.v.layout).toMatchObject({
            s: SlotKind.Tombstone,
            a: 'device-1'
        });
    });

    it('reads atomic fields through get', () => {
        const storage = createTestStorage();

        storage.transaction(draft => {
            draft.set('count', (draft.at('count').get() ?? 0) + 1);
            draft.set('title', `${draft.at('title').get()}-updated`);

            expectAssignable<number>(draft.at('count').get());
            expectAssignable<string>(draft.at('title').get());
            // @ts-expect-error record lookup should use entry()
            draft.at('users').at('missing');
            expectAssignable<ReadonlyUser | undefined>(draft.at('users').entry('missing').get());
            // @ts-expect-error record lookup can be missing
            expectAssignable<ReadonlyUser>(draft.at('users').entry('missing').get());
            expectAssignable<string | undefined>(draft.at('settings').at('layout').get());
            // @ts-expect-error optional field lookup can be missing
            expectAssignable<string>(draft.at('settings').at('layout').get());

            expect(draft.at('count').get()).toBe(1);
            expect(draft.at('title').get()).toBe('initial-updated');
            expect(draft.get()).toEqual({
                count: 1,
                title: 'initial-updated',
                users: {},
                flags: {},
                settings: {
                    theme: 'light'
                }
            });

            draft.set('count', 2);
            draft.set('title', 'assigned');
        });

        expect(storage.read()).toEqual({
            count: 2,
            title: 'assigned',
            users: {},
            flags: {},
            settings: {
                theme: 'light'
            }
        });
    });

    it('uses entry for possibly missing object fields', () => {
        const storage = createTestStorage();

        storage.transaction(draft => {
            const alice = draft.at('users').entry('alice');

            expect(alice.exists()).toBe(false);
            expect(alice.get()).toBeUndefined();
            expect(() => alice.unwrap()).toThrow('Draft entry "alice" does not exist');

            alice.orDefault({ name: 'Alice' }).set('active', true);
            expect(alice.exists()).toBe(true);

            expect(alice.get()).toEqual({
                name: 'Alice',
                active: true
            });

            alice.set({ name: 'Alice Updated' });
            expect(alice.get()).toEqual({
                name: 'Alice Updated'
            });

            alice.update(user => {
                user.set('active', false);
            });
            expect(alice.get()).toEqual({
                name: 'Alice Updated',
                active: false
            });

            alice.delete();
            expect(alice.exists()).toBe(false);
            expect(() => alice.update(() => {})).toThrow('Draft entry "alice" does not exist');
            alice.set({ name: 'Alice Restored' });
        });

        expect(storage.read().users).toEqual({
            alice: {
                name: 'Alice Restored'
            }
        });
    });

    it('maps atomic fields from returned drafts', () => {
        const storage = createTestStorage();

        storage.transaction(draft => {
            draft.at('settings').set('theme', 'copied-title');
            draft.set('title', title => {
                expect(title.get()).toBe('initial');

                return draft.at('settings').at('theme');
            });
        });

        expect(storage.read()).toMatchObject({
            title: 'copied-title',
            settings: {
                theme: 'copied-title'
            }
        });
    });

    it('maps object fields from returned drafts', () => {
        const storage = createTestStorage();

        storage.transaction(draft => {
            draft.set('settings', settings => {
                expect(settings.get()).toEqual({
                    theme: 'light'
                });
                settings.set('layout', 'mapped');

                return settings;
            });
        });

        expect(storage.read()).toEqual({
            count: 0,
            title: 'initial',
            users: {},
            flags: {},
            settings: {
                theme: 'light',
                layout: 'mapped'
            }
        });
    });

    it('requires nullable object drafts to be unwrapped or defaulted', () => {
        const storage = createNullableStorage();

        storage.transaction(draft => {
            const users = draft.at('users');

            expect(users.get()).toBeNull();
            expect(users.isNull()).toBe(true);
            expect(() => users.unwrap()).toThrow('Nullable draft value is null');
            expect(users.ifPresent(() => {})).toBe(false);

            // @ts-expect-error nullable object draft must be unwrapped or defaulted first
            expectAssignable<{ entry(key: string): unknown }>(users);

            const objectDraft = users.orDefault({});
            expectAssignable<Record<string, ReadonlyNullableUser>>(objectDraft.get());
            objectDraft.entry('alice').set({ name: 'Alice' });
            expect(
                users.ifPresent(present => present.entry('alice').set({ name: 'Alice Present' }))
            ).toBe(true);

            expect(users.get()).toEqual({
                alice: {
                    name: 'Alice Present'
                }
            });
            expect(users.isNull()).toBe(false);

            users.setNull();
            expect(users.get()).toBeNull();

            users.set({ bob: { name: 'Bob' } });
            expect(users.unwrap().entry('bob').get()).toEqual({ name: 'Bob' });
        });

        expect(storage.read()).toEqual({
            users: {
                bob: {
                    name: 'Bob'
                }
            },
            title: null
        });
    });

    it('wraps nullable atomic drafts explicitly', () => {
        const storage = createNullableStorage();

        storage.transaction(draft => {
            const title = draft.at('title');

            expectAssignable<string | null>(title.get());
            expect(title.get()).toBeNull();

            title.orDefault('initial').set('updated');
            expect(title.get()).toBe('updated');

            title.setNull();
            expect(title.get()).toBeNull();

            title.set('assigned');
            expect(title.unwrap().get()).toBe('assigned');
        });

        expect(storage.read()).toEqual({
            users: null,
            title: 'assigned'
        });
    });
});
