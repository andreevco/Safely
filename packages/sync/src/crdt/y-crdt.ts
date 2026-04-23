import * as Y from 'yjs';
import { z } from 'zod';

import { atomicTransaction } from './atomic-transaction';
import { deepMerge } from './deep-merge/deep-merge';
import { isArray, isPlainObject } from './deep-merge/helpers';
import { yValueToJs } from './deep-merge/y-value-to-js';
import {
    getArrayItemSchema,
    getArrayMeta,
    getObjectFieldSchema,
    resolveSchemaForValue
} from './deep-merge/z-schema';
import { AnyStorageVersion } from './version';
import { getAsArray, getAsMap } from '../utils/yjs';
import { applyRemoteUpdate } from './deep-merge/apply-remote-update';

export class YCRDT {
    private constructor(
        private readonly doc: Y.Doc,
        public readonly versions: AnyStorageVersion[],
        private readonly myDeviceId: string
    ) {}

    public static create(ydoc: Y.Doc, versions: AnyStorageVersion[], myDeviceId: string): YCRDT {
        const self = new YCRDT(ydoc, versions, myDeviceId);

        const existingVs = existingVersions(ydoc);
        if (existingVs.length === 0) {
            atomicTransaction(ydoc, doc => {
                const root = doc.getMap('root');
                const version = getAsMap(root, versions[0].version.toString());
                const initialValues = versions[0].migrate({});
                for (const [key, value] of Object.entries(initialValues)) {
                    deepMerge(version, key, value, versions[0].schema[key], myDeviceId);
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
            migrateIfNeeded(doc, this.versions, lastExisting.version, this.myDeviceId);
        });
    }

    // TODO: make this atomic and transactional
    public applyUpdate(update: Buffer, origin: string, remoteStorageVersion: number): void {
        const temp = new Y.Doc();
        Y.applyUpdateV2(temp, this.encodeAsSnapshot());
        Y.applyUpdateV2(temp, update);

        const remote = new Y.Doc();
        Y.applyUpdateV2(remote, update);

        if (remoteStorageVersion < this.lastVersion().version) {
            const versions = existingVersions(temp);
            if (versions.includes(lastVersion(this.versions).version.toString())) {
                // TODO: reconcile
            }

            atomicTransaction(this.doc, doc => {
                for (const existingVersion of versions) {
                    const map = versionMap(temp, existingVersion);
                    const map1 = versionMap(doc, existingVersion);
                    const map2 = versionMap(remote, existingVersion);

                    const version =
                        this.versions.find(v => v.version.toString() === existingVersion) ||
                        (() => {
                            throw new Error('Version was not found');
                        })();

                    applyRemoteUpdate(map, map1, map2, z.object(version.schema));
                }
                Y.applyUpdateV2(doc, Y.encodeStateAsUpdateV2(temp), origin);
                migrateIfNeeded(doc, this.versions, remoteStorageVersion, this.myDeviceId);
            });
        } else {
            const versions = existingVersions(temp);
            atomicTransaction(this.doc, doc => {
                for (const existingVersion of versions) {
                    const map = versionMap(temp, existingVersion);
                    const map1 = versionMap(doc, existingVersion);
                    const map2 = versionMap(remote, existingVersion);

                    const version = this.versions.find(
                        v => v.version.toString() === existingVersion
                    );
                    if (version === undefined) {
                        continue;
                    }

                    applyRemoteUpdate(map, map1, map2, z.object(version.schema));
                }
                Y.applyUpdateV2(doc, Y.encodeStateAsUpdateV2(temp), origin);
            });
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
            deepMerge(
                lastVersionMap(doc, this.versions),
                k,
                v,
                this.lastVersion().schema[k],
                this.myDeviceId
            );
            reverseMigrateIfNeeded(doc, this.versions, this.myDeviceId);
        });
    }

    public equals(other: YCRDT): boolean {
        return (
            stableStringify(this.exportLogicalState()) ===
            stableStringify(other.exportLogicalState())
        );
    }

    private exportLogicalState(): Record<string, unknown> {
        const rootState: Record<string, unknown> = {};

        for (const version of this.versions) {
            const versionKey = version.version.toString();
            const root = this.doc.getMap('root');

            if (!root.has(versionKey)) {
                continue;
            }

            rootState[versionKey] = getVersionFullState(this.doc, version);
        }

        return {
            root: rootState
        };
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

function stableStringify(value: unknown): string {
    return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortDeep);
    }

    if (value !== null && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        return Object.fromEntries(
            Object.keys(obj)
                .sort()
                .map(key => [key, sortDeep(obj[key])])
        );
    }

    return value;
}

// TODO(perf): migrate only the changed keys
function migrateIfNeeded(
    doc: Y.Doc,
    versions: AnyStorageVersion[],
    startingVersion: number,
    myId: string
): void {
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
                deepMerge(map, key, value, version.schema[key], myId);
            }
        }
    }
}

// TODO(perf): reverse migrate only the changed keys
function reverseMigrateIfNeeded(doc: Y.Doc, versions: AnyStorageVersion[], myId: string): void {
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
                deepMerge(map, key, value, version.schema[key], myId);
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
    const root = versionMap(doc, version.version.toString());
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

function versionMap(doc: Y.Doc, version: string): Y.Map<unknown> {
    const root = doc.getMap('root');
    return getAsMap(root, version);
}

function lastVersionMap(doc: Y.Doc, versions: AnyStorageVersion[]): Y.Map<unknown> {
    const root = doc.getMap('root');
    const key = versions[versions.length - 1].version.toString();
    return getAsMap(root, key);
}

function lastVersion(versions: AnyStorageVersion[]): AnyStorageVersion {
    return versions[versions.length - 1];
}

// function reconcile(tempDoc: Y.Doc, doc: Y.Doc, versions: AnyStorageVersion[], myId: string): void {
//     const version = lastVersion(versions);
//     const schema = version.schema;
//
//     atomicTransaction(tempDoc, tmp => {
//         const remote = lastVersionMap(tmp, versions);
//         const local = lastVersionMap(doc, versions);
//         const keys = new Set<string>([...remote.keys(), ...local.keys(), ...Object.keys(schema)]);
//
//         for (const key of keys) {
//             const fieldSchema = schema[key];
//             if (!fieldSchema) {
//                 continue;
//             }
//
//             const localValue = yValueToJs(local.get(key), fieldSchema);
//             const remoteValue = yValueToJs(remote.get(key), fieldSchema);
//             const merged = reconcileValues(localValue, remoteValue, fieldSchema);
//             deepMerge(remote, key, merged, fieldSchema, myId);
//         }
//     });
//
//     const update = Y.encodeStateAsUpdateV2(tempDoc, Y.encodeStateVector(doc));
//     if (update.length > 0) {
//         Y.applyUpdateV2(doc, update, 'reconcile');
//     }
// }

function reconcileValues(local: unknown, remote: unknown, schema: z.ZodTypeAny): unknown {
    if (local === undefined) {
        return cloneJsonSafe(remote);
    }
    if (remote === undefined) {
        return cloneJsonSafe(local);
    }

    const resolvedLocal = resolveSchemaForValue(schema, local);
    const resolvedRemote = resolveSchemaForValue(schema, remote);

    if (isArray(local) && isArray(remote)) {
        return reconcileArrays(local, remote, resolvedRemote);
    }

    if (isPlainObject(local) && isPlainObject(remote)) {
        return reconcileObjects(local, remote, resolvedLocal, resolvedRemote);
    }

    const localDeltaLength = scalarDeltaLength(local);
    const remoteDeltaLength = scalarDeltaLength(remote);
    if (remoteDeltaLength >= localDeltaLength) {
        return cloneJsonSafe(remote);
    }
    return cloneJsonSafe(local);
}

function reconcileArrays(local: unknown[], remote: unknown[], schema: z.ZodTypeAny): unknown[] {
    const meta = getArrayMeta(schema);
    const itemSchema = getArrayItemSchema(schema);
    const localById = new Map<string, unknown>();
    const remoteById = new Map<string, unknown>();

    for (const item of local) {
        localById.set(meta.getId(item), item);
    }
    for (const item of remote) {
        remoteById.set(meta.getId(item), item);
    }

    const result: unknown[] = [];
    const seen = new Set<string>();

    for (const remoteItem of remote) {
        const id = meta.getId(remoteItem);
        const localItem = localById.get(id);
        if (localItem === undefined) {
            result.push(cloneJsonSafe(remoteItem));
        } else {
            result.push(reconcileValues(localItem, remoteItem, itemSchema));
        }
        seen.add(id);
    }

    for (const localItem of local) {
        const id = meta.getId(localItem);
        if (seen.has(id)) {
            continue;
        }
        result.push(cloneJsonSafe(localItem));
    }

    return result;
}

function reconcileObjects(
    local: Record<string, unknown>,
    remote: Record<string, unknown>,
    localSchema: z.ZodTypeAny,
    remoteSchema: z.ZodTypeAny
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const key of keys) {
        const localValue = local[key];
        const remoteValue = remote[key];
        const childSchema = resolveChildSchema(localSchema, remoteSchema, key);
        result[key] = reconcileValues(localValue, remoteValue, childSchema);
    }

    return result;
}

function resolveChildSchema(
    localSchema: z.ZodTypeAny,
    remoteSchema: z.ZodTypeAny,
    key: string
): z.ZodTypeAny {
    const localObject =
        localSchema instanceof z.ZodObject || localSchema instanceof z.ZodRecord
            ? localSchema
            : null;
    const remoteObject =
        remoteSchema instanceof z.ZodObject || remoteSchema instanceof z.ZodRecord
            ? remoteSchema
            : null;

    if (remoteObject) {
        return getObjectFieldSchema(remoteObject, key);
    }
    if (localObject) {
        return getObjectFieldSchema(localObject, key);
    }
    return remoteSchema;
}

function scalarDeltaLength(value: unknown): number {
    if (value === undefined) {
        return 0;
    }
    console.log(value);

    if (
        typeof value === 'object' &&
        value !== null &&
        'toDelta' in value &&
        typeof (value as { toDelta: unknown }).toDelta === 'function'
    ) {
        // Prefer Yjs delta length for CRDT scalar-like values (e.g. Y.Text).
        const delta = (value as { toDelta: () => unknown }).toDelta();
        const serializedDelta = JSON.stringify(delta);
        return serializedDelta?.length ?? 0;
    }

    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
        return 0;
    }
    return serialized.length;
}

function cloneJsonSafe<T>(value: T): T {
    if (value === undefined) {
        return value;
    }
    if (typeof globalThis.structuredClone === 'function') {
        return globalThis.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}
