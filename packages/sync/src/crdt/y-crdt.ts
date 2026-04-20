import * as Y from 'yjs';

import { atomicTransaction } from './atomic-transaction';
import { deepMerge } from './deep-merge/deep-merge';
import { yValueToJs } from './deep-merge/y-value-to-js';
import { AnyStorageVersion } from './version';
import { getAsArray, getAsMap } from '../utils/yjs';

export class YCRDT {
    private constructor(
        private readonly doc: Y.Doc,
        public readonly versions: AnyStorageVersion[]
    ) {}

    public static create(ydoc: Y.Doc, versions: AnyStorageVersion[]): YCRDT {
        const self = new YCRDT(ydoc, versions);

        const existingVs = existingVersions(ydoc);
        if (existingVs.length === 0) {
            atomicTransaction(ydoc, doc => {
                const root = doc.getMap('root');
                const version = getAsMap(root, versions[0].version.toString());
                const initialValues = versions[0].migrate({});
                for (const [key, value] of Object.entries(initialValues)) {
                    deepMerge(version, key, value, versions[0].schema[key]);
                }
            });
        }

        self.migrateToLastVersionIfNeeded();
        return self;
    }

    public migrateToLastVersionIfNeeded(): void {
        const existingVs = new Set(existingVersions(this.doc));
        const last = this.lastVersion();

        if (existingVs.has(last.version.toString())) {
            return;
        }

        const lastExisting = [...this.versions]
            .reverse()
            .find(v => existingVs.has(v.version.toString()));

        if (!lastExisting) {
            return;
        }

        atomicTransaction(this.doc, doc => {
            migrateIfNeeded(doc, this.versions, lastExisting.version);
        });
    }

    public applyUpdate(update: Buffer, origin: string, remoteStorageVersion: number): void {
        if (remoteStorageVersion < this.lastVersion().version) {
            atomicTransaction(this.doc, doc => {
                Y.applyUpdateV2(doc, update, origin);
                migrateIfNeeded(doc, this.versions, remoteStorageVersion);
            });
        } else {
            Y.applyUpdateV2(this.doc, update, origin);
        }
    }

    public encodeAsSnapshot(): Buffer {
        return Buffer.from(Y.encodeStateAsUpdateV2(this.doc));
    }

    // Read from last version
    public get(k: string): unknown {
        const version = this.lastVersionMap();
        const value = version.get(k);
        return value !== undefined ? yValueToJs(value, this.lastVersion().schema[k]) : null;
    }

    public systemGetArray(k: string): Y.Array<string> {
        const system = this.systemMap();
        return getAsArray(system, k);
    }

    public onUpdate(observer: (update: Buffer, origin: string) => void): () => void {
        const handler = (update: Uint8Array, origin: unknown) => {
            observer(Buffer.from(update), typeof origin === 'string' ? origin : 'local');
        };
        this.doc.on('updateV2', handler);

        return () => {
            this.doc.off('updateV2', handler);
        };
    }

    // TODO: remove this function?
    public remove(k: string): void {
        const map = this.doc.getMap<string>('root');
        map.delete(k);
    }

    // When value is changed, reverse migrate if needed
    public set(k: string, v: unknown): void {
        atomicTransaction(this.doc, doc => {
            deepMerge(lastVersionMap(doc, this.versions), k, v, this.lastVersion().schema[k]);
            reverseMigrateIfNeeded(doc, this.versions);
        });
    }

    public equals(other: YCRDT): boolean {
        const thisSnapshot = Buffer.from(Y.encodeStateAsUpdateV2(this.doc));
        const otherSnapshot = Buffer.from(Y.encodeStateAsUpdateV2(other.doc));
        return thisSnapshot.equals(otherSnapshot);
    }

    public toRaw(): Y.Doc {
        return this.doc;
    }

    private lastVersionMap(): Y.Map<unknown> {
        const root = this.doc.getMap('root');
        const key = this.versions[this.versions.length - 1].version.toString();
        return getAsMap(root, key);
    }

    private lastVersion(): AnyStorageVersion {
        return this.versions[this.versions.length - 1];
    }

    private systemMap(): Y.Map<unknown> {
        return this.doc.getMap('system');
    }
}

// TODO(perf): migrate only the changed keys
function migrateIfNeeded(doc: Y.Doc, versions: AnyStorageVersion[], startingVersion: number): void {
    const startIndex = versions.findIndex(v => v.version === startingVersion);
    if (startIndex === -1) {
        throw new Error(`Unknown starting version: ${startingVersion}`);
    }

    const existing = new Set(existingVersions(doc));
    let state = getVersionFullState(doc, versions[startIndex]);

    for (let i = startIndex + 1; i < versions.length; i++) {
        const version = versions[i];
        state = version.migrate(state);

        if (existing.has(version.version.toString()) || i === versions.length - 1) {
            const root = doc.getMap('root');
            const map = getAsMap(root, version.version.toString());
            for (const [key, value] of Object.entries(state)) {
                deepMerge(map, key, value, version.schema[key]);
            }
        }
    }
}

// TODO(perf): reverse migrate only the changed keys
function reverseMigrateIfNeeded(doc: Y.Doc, versions: AnyStorageVersion[]): void {
    const vs = existingVersions(doc);
    if (vs.length === 1) {
        return;
    }

    let state = getLastVersionFullState(doc, versions);

    for (let i = versions.length - 1; i >= 0; i--) {
        const version = versions[i];
        if (
            vs.includes(version.version.toString()) &&
            version.version !== lastVersion(versions).version
        ) {
            const root = doc.getMap('root');
            const map = getAsMap(root, version.version.toString());
            for (const [key, value] of Object.entries(state)) {
                deepMerge(map, key, value, version.schema[key]);
            }
        }
        state = version.reverseMigrate(state);
    }
}

function existingVersions(doc: Y.Doc): string[] {
    const root = doc.getMap('root');
    return Array.from(root.keys());
}

function getVersionFullState(doc: Y.Doc, version: AnyStorageVersion): Record<string, unknown> {
    const root = versionMap(doc, version);
    const state: Record<string, unknown> = {};
    for (const [key, value] of root.entries()) {
        state[key] = yValueToJs(value, version.schema[key]);
    }
    return state;
}

function getLastVersionFullState(
    doc: Y.Doc,
    versions: AnyStorageVersion[]
): Record<string, unknown> {
    const root = lastVersionMap(doc, versions);
    const state: Record<string, unknown> = {};
    for (const [key, value] of root.entries()) {
        state[key] = yValueToJs(value, lastVersion(versions).schema[key]);
    }
    return state;
}

function versionMap(doc: Y.Doc, version: AnyStorageVersion): Y.Map<unknown> {
    const root = doc.getMap('root');
    const key = version.version.toString();
    return getAsMap(root, key);
}

function lastVersionMap(doc: Y.Doc, versions: AnyStorageVersion[]): Y.Map<unknown> {
    const root = doc.getMap('root');
    const key = versions[versions.length - 1].version.toString();
    return getAsMap(root, key);
}

function lastVersion(versions: AnyStorageVersion[]): AnyStorageVersion {
    return versions[versions.length - 1];
}
