import type { ISecretEncryptor } from '@safely/core';
import { assertUnreachable } from '@safely/core';
import { Contact, FiatAsset, PortfolioFactory } from '@safely/core';
import type { SContact, SPortfolio, SyncedStorageSchema } from '@safely/sync-storage';

import type { AccountStoreData, SyncedSlotKey } from './account-store';

type WithId = { id: string | { toString(): string } };
type WithToJson<J> = { toJSON(): J };

export class AccountStoreTransform {
    constructor(private readonly getSecretEncryptor: () => ISecretEncryptor) {}

    public restore<K extends SyncedSlotKey>(
        key: K,
        json: SyncedStorageSchema[K],
        prev: AccountStoreData | null
    ): AccountStoreData[K] {
        switch (key) {
            case 'portfolios':
                return this.portfolios(
                    json as SyncedStorageSchema['portfolios'],
                    prev?.portfolios
                ) as AccountStoreData[K];
            case 'contacts':
                return this.contacts(
                    json as SyncedStorageSchema['contacts'],
                    prev?.contacts
                ) as AccountStoreData[K];
            case 'preferredFiat':
                return this.preferredFiat(
                    json as SyncedStorageSchema['preferredFiat']
                ) as AccountStoreData[K];
            case 'devicesMeta':
                return this.devicesMeta(
                    json as SyncedStorageSchema['devicesMeta']
                ) as AccountStoreData[K];
            case 'meta':
                return this.meta(json as SyncedStorageSchema['meta']) as AccountStoreData[K];
            case 'analyticsId':
                return this.analyticsId(
                    json as SyncedStorageSchema['analyticsId']
                ) as AccountStoreData[K];
            default:
                assertUnreachable(key);
        }
    }

    public restoreAll(accountId: string, raw: SyncedStorageSchema): AccountStoreData {
        return {
            accountId,
            meta: this.meta(raw.meta),
            portfolios: this.portfolios(raw.portfolios),
            contacts: this.contacts(raw.contacts),
            preferredFiat: this.preferredFiat(raw.preferredFiat),
            devicesMeta: this.devicesMeta(raw.devicesMeta),
            analyticsId: this.analyticsId(raw.analyticsId)
        };
    }

    private portfolios(
        json: SPortfolio[] | null,
        prev?: AccountStoreData['portfolios']
    ): AccountStoreData['portfolios'] {
        if (!json) return [];
        return this.reconcileById(prev, json, p =>
            PortfolioFactory.restorePortfolio(this.getSecretEncryptor(), p)
        );
    }

    private contacts(
        json: SContact[] | null,
        prev?: AccountStoreData['contacts']
    ): AccountStoreData['contacts'] {
        if (!json) return [];
        return this.reconcileById(prev, json, c => Contact.restoreContact(c));
    }

    private preferredFiat(
        json: SyncedStorageSchema['preferredFiat']
    ): AccountStoreData['preferredFiat'] {
        if (!json) return null;
        return FiatAsset.restore(json);
    }

    private devicesMeta(json: SyncedStorageSchema['devicesMeta']): AccountStoreData['devicesMeta'] {
        return json;
    }

    private meta(json: SyncedStorageSchema['meta']): AccountStoreData['meta'] {
        return json;
    }

    private analyticsId(json: SyncedStorageSchema['analyticsId']): AccountStoreData['analyticsId'] {
        return json;
    }

    private reconcileById<T extends WithId & WithToJson<unknown>, J>(
        prev: T[] | undefined,
        nextJson: J[],
        restore: (json: J) => T
    ): T[] {
        const keyOf = (item: WithId) =>
            typeof item.id === 'string' ? item.id : item.id.toString();

        if (!prev || prev.length === 0) return nextJson.map(restore);

        const prevById = new Map<string, T>();
        for (const p of prev) prevById.set(keyOf(p), p);

        return nextJson.map(j => {
            const fresh = restore(j);
            const old = prevById.get(keyOf(fresh));
            if (old && JSON.stringify(old.toJSON()) === JSON.stringify(j)) return old;
            return fresh;
        });
    }
}
