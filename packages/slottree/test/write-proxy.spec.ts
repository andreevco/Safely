import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createStorage, StorageImpl } from '../src';
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

function createTestStorage() {
    return createStorage({
        authorId: 'device-1',
        versions
    });
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

            expect(draft.at('users').at('carol').get()).toEqual({
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
});
