import {
  cloneDeep,
  cloneSlot,
  ContainerSlot,
  createOriginContainer,
  isContainerSlot,
  Slot,
  slotFromJson,
  stripSlot,
  validateSlot,
} from "./slots";
import {
  AssertVersionHList,
  HCons,
  hListToRuntimeArray,
  NewOf,
  StorageVersion,
} from "./version";
import { DeepReadonly, JsonValue, Path, PathValue, WriteDraft } from "./json";
import { MergeProtocol, MergeStats } from "./mergeProtocol";
import {
  deleteJsonAtPath,
  JsonStorageSelection,
  selectJsonStorage,
  setJsonAtPath,
} from "./write";
import { z } from "zod";

export interface Storage<T> {
  readonly version: number;

  /**
   * Returns full storage as JSON representation
   */
  get(): T;

  /**
   * Returns readonly Proxy over storage
   */
  read(): DeepReadonly<T>;

  /**
   * Atomic and transactional update of the storage
   * @param fn
   */
  update(fn: (draft: WriteDraft<T>) => void): void;

  /**
   * Merge storage
   * @param incoming
   */
  merge(incoming: Slot): void;

  /**
   * Export storage to save or send to other device
   */
  export(): Slot;
}

class StorageImpl<T> implements Storage<T> {
  private readonly protocol: MergeProtocol;
  private root: ContainerSlot;
  private readonly versions: readonly StorageVersion[];

  constructor(options: {
    authorId: string;
    versions: readonly StorageVersion[];
    root?: ContainerSlot;
  }) {
    this.protocol = new MergeProtocol(options.authorId);
    this.versions = options.versions;

    if (options.root !== undefined) {
      validateSlot(options.root);
    }

    this.root =
      options.root === undefined
        ? createOriginContainer()
        : cloneSlot(options.root);

    this.ensureLatestInitialized();
    this.protocol.observeTree(this.root);
  }

  get version(): number {
    return this.latestVersion().version;
  }

  get(): T {
    const value = stripSlot(this.latestContainer());

    return this.latestVersion().schema.parse(value) as T;
  }

  read(): DeepReadonly<T> {
    return cloneDeep(this.get()) as DeepReadonly<T>;
  }

  update(fn: (draft: WriteDraft<T>) => void): void {
    const timestamp = this.protocol.tick();
    const author = this.protocol.id;

    const workingRoot = cloneSlot(this.root);

    const draft = this.createWriteProxy(
      selectJsonStorage(
        this.latestContainerInRoot(workingRoot),
        timestamp,
        author,
      ),
    ) as WriteDraft<T>;

    fn(draft);

    this.validateLatestInRoot(workingRoot);
    this.propagateToOlderVersionsInRoot(workingRoot, timestamp, author);

    this.root = workingRoot;
  }

  merge(incoming: Slot): MergeStats {
    validateSlot(incoming);

    const workingRoot = cloneSlot(this.root);
    const stats = this.protocol.merge(workingRoot, incoming);

    this.validateLatestInRoot(workingRoot);

    this.root = workingRoot;
    this.protocol.observeTree(this.root);
    return stats;
  }

  export(): Slot {
    return cloneSlot(this.root);
  }

  private createWriteProxy(selection: JsonStorageSelection): unknown {
    return new Proxy(Object.create(null), {
      get: (_target, prop) => {
        if (typeof prop !== "string") {
          return undefined;
        }

        const slot = selection.get(prop);

        if (slot === undefined || slot.d === true) {
          return undefined;
        }

        if (isContainerSlot(slot)) {
          const childSelection = selection.select(prop);

          if (childSelection === undefined) {
            return undefined;
          }

          return this.createWriteProxy(childSelection);
        }

        return cloneDeep(slot.v);
      },

      set: (_target, prop, value) => {
        if (typeof prop !== "string") {
          return false;
        }

        selection.set(prop, value as JsonValue);

        return true;
      },

      deleteProperty: (_target, prop) => {
        if (typeof prop !== "string") {
          return false;
        }

        selection.delete(prop);

        return true;
      },
    });
  }

  private latestVersion(): StorageVersion {
    const latest = this.versions[this.versions.length - 1];

    if (latest === undefined) {
      throw new Error("Storage must have at least one version");
    }

    return latest;
  }

  private latestContainer(): ContainerSlot {
    const key = String(this.latestVersion().version);
    const slot = this.root.v[key];

    if (!isContainerSlot(slot)) {
      this.root.v[key] = createOriginContainer();
    }

    return this.root.v[key] as ContainerSlot;
  }

  private validateLatest(): unknown {
    return this.latestVersion().schema.parse(stripSlot(this.latestContainer()));
  }

  private ensureLatestInitialized(): void {
    const latest = this.latestVersion();
    const key = String(latest.version);

    if (this.root.v[key] !== undefined) {
      this.validateLatest();
      return;
    }

    const initial =
      typeof latest.initial === "function"
        ? (latest.initial as () => unknown)()
        : latest.initial;

    const parsed = latest.schema.parse(initial);

    this.root.v[key] = slotFromJson(parsed as JsonValue, 0, "");
  }

  private propagateToOlderVersionsInRoot(
    root: ContainerSlot,
    timestamp: number,
    author: string,
  ): void {
    let current = this.validateLatestInRoot(root);

    const latest = this.latestVersion();
    const knownVersionsLength = Object.keys(root.v).filter(
      (x) => Number(x) <= latest.version,
    ).length;
    if (knownVersionsLength <= 1) {
      return;
    }

    for (let index = this.versions.length - 1; index > 0; index -= 1) {
      const fromVersion = this.versions[index];
      const toVersion = this.versions[index - 1];

      const migrated = toVersion.schema.parse(
        fromVersion.reverseMigrate(current),
      );

      const existing = root.v[String(toVersion.version)];
      const source = root.v[String(fromVersion.version)];
      if (isContainerSlot(existing)) {
        const parsedExisting = toVersion.schema.parse(stripSlot(existing));
        this.applyJsonDiffInRoot(
          existing,
          migrated as JsonValue,
          parsedExisting as JsonValue,
          timestamp,
          author,
          isContainerSlot(source) ? source : undefined,
        );
      }

      current = migrated;
    }
  }

  private applyJsonDiffInRoot(
    container: ContainerSlot,
    next: JsonValue,
    current: JsonValue,
    timestamp: number,
    author: string,
    source?: ContainerSlot,
  ): void {
    this.applyJsonDiff(
      selectJsonStorage(container, timestamp, author),
      next,
      current,
      source === undefined
        ? undefined
        : selectJsonStorage(source, timestamp, author),
    );
  }

  private applyJsonDiff(
    selection: JsonStorageSelection,
    next: JsonValue,
    current: JsonValue,
    source?: JsonStorageSelection,
  ): void {
    if (this.jsonEquals(next, current)) {
      return;
    }

    if (
      typeof next !== "object" ||
      next === null ||
      Array.isArray(next) ||
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current)
    ) {
      throw new Error("Cannot replace version root during propagation");
    }

    const nextObject = next as Record<string, JsonValue>;
    const currentObject = current as Record<string, JsonValue>;
    const keys = new Set([
      ...Object.keys(nextObject),
      ...Object.keys(currentObject),
    ]);

    for (const key of keys) {
      if (!(key in nextObject)) {
        selection.delete(key);
        continue;
      }

      if (!(key in currentObject)) {
        selection.set(key, nextObject[key]);
        continue;
      }

      this.applyJsonDiffProperty(
        selection,
        key,
        nextObject[key],
        currentObject[key],
        source,
      );
    }
  }

  private applyJsonDiffProperty(
    selection: JsonStorageSelection,
    key: string,
    next: JsonValue,
    current: JsonValue,
    source?: JsonStorageSelection,
  ): void {
    if (this.jsonEquals(next, current)) {
      return;
    }

    if (
      typeof next === "object" &&
      next !== null &&
      !Array.isArray(next) &&
      typeof current === "object" &&
      current !== null &&
      !Array.isArray(current)
    ) {
      this.applyJsonDiff(
        selection.selectOrCreate(key),
        next,
        current,
        source?.select(key),
      );
      return;
    }

    if (source?.get(key)?.d === true) {
      selection.delete(key);
    } else {
      selection.set(key, next);
    }
  }

  private jsonEquals(left: JsonValue, right: JsonValue): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private latestContainerInRoot(root: ContainerSlot): ContainerSlot {
    const key = String(this.latestVersion().version);
    const slot = root.v[key];

    if (!isContainerSlot(slot)) {
      root.v[key] = createOriginContainer();
    }

    return root.v[key] as ContainerSlot;
  }

  private validateLatestInRoot(root: ContainerSlot): unknown {
    return this.latestVersion().schema.parse(
      stripSlot(this.latestContainerInRoot(root)),
    );
  }
}

export function createStorage<Latest extends StorageVersion, Rest>(options: {
  authorId: string;
  versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>;
  root?: ContainerSlot;
}): Storage<z.output<NewOf<Latest>>> {
  return new StorageImpl({
    authorId: options.authorId,
    versions: hListToRuntimeArray(options.versions),
    root: options.root,
  }) as Storage<z.output<NewOf<Latest>>>;
}
