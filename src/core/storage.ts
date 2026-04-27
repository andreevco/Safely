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
import { deleteJsonAtPath, setJsonAtPath } from "./write";
import { z } from "zod";

const MUTATING_ARRAY_METHODS = new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift",
]);

export interface Storage<T> {
  readonly version: number;

  get(): T;
  read(): DeepReadonly<T>;

  update(fn: (draft: WriteDraft<T>) => void): void;

  set<P extends Path<T>>(path: P, value: PathValue<T, P>): void;
  delete<P extends Path<T>>(path: P): void;

  merge(incoming: Slot): void;
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
      workingRoot,
      [],
      timestamp,
      author,
    ) as WriteDraft<T>;

    fn(draft);

    this.validateLatestInRoot(workingRoot);
    this.propagateToOlderVersionsInRoot(workingRoot, timestamp, author);

    this.root = workingRoot;
  }

  set<P extends Path<T>>(path: P, value: PathValue<T, P>): void {
    const timestamp = this.protocol.tick();
    const author = this.protocol.id;

    const workingRoot = cloneSlot(this.root);

    setJsonAtPath(
      this.latestContainerInRoot(workingRoot),
      path as string[],
      value as JsonValue,
      timestamp,
      author,
    );

    this.validateLatestInRoot(workingRoot);
    this.propagateToOlderVersionsInRoot(workingRoot, timestamp, author);

    this.root = workingRoot;
  }

  delete<P extends Path<T>>(path: P): void {
    const timestamp = this.protocol.tick();
    const author = this.protocol.id;

    const workingRoot = cloneSlot(this.root);

    deleteJsonAtPath(
      this.latestContainerInRoot(workingRoot),
      path as string[],
      timestamp,
      author,
    );

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

  private createWriteProxy(
    root: ContainerSlot,
    path: string[],
    timestamp: number,
    author: string,
  ): unknown {
    return new Proxy(Object.create(null), {
      get: (_target, prop) => {
        if (typeof prop !== "string") {
          return undefined;
        }

        const slot = this.slotAtPath(this.latestContainerInRoot(root), [
          ...path,
          prop,
        ]);

        if (slot === undefined || slot.d === true) {
          return undefined;
        }

        if (isContainerSlot(slot)) {
          return this.createWriteProxy(
            root,
            [...path, prop],
            timestamp,
            author,
          );
        }

        return cloneDeep(slot.v);
      },

      set: (_target, prop, value) => {
        if (typeof prop !== "string") {
          return false;
        }

        const latest = this.latestContainerInRoot(root);

        setJsonAtPath(
          latest,
          [...path, prop],
          value as JsonValue,
          timestamp,
          author,
        );

        return true;
      },

      deleteProperty: (_target, prop) => {
        if (typeof prop !== "string") {
          return false;
        }

        const latest = this.latestContainerInRoot(root);

        deleteJsonAtPath(latest, [...path, prop], timestamp, author);

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
          [],
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
    path: string[],
    timestamp: number,
    author: string,
    source?: ContainerSlot,
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
      if (path.length === 0) {
        throw new Error("Cannot replace version root during propagation");
      }

      if (this.slotAtPath(source, path)?.d === true) {
        deleteJsonAtPath(container, path, timestamp, author);
      } else {
        setJsonAtPath(container, path, next, timestamp, author);
      }
      return;
    }

    const nextObject = next as Record<string, JsonValue>;
    const currentObject = current as Record<string, JsonValue>;
    const keys = new Set([
      ...Object.keys(nextObject),
      ...Object.keys(currentObject),
    ]);

    for (const key of keys) {
      if (!(key in nextObject)) {
        deleteJsonAtPath(container, [...path, key], timestamp, author);
        continue;
      }

      if (!(key in currentObject)) {
        setJsonAtPath(
          container,
          [...path, key],
          nextObject[key],
          timestamp,
          author,
        );
        continue;
      }

      this.applyJsonDiffInRoot(
        container,
        nextObject[key],
        currentObject[key],
        [...path, key],
        timestamp,
        author,
        source,
      );
    }
  }

  private slotAtPath(
    container: ContainerSlot | undefined,
    path: string[],
  ): Slot | undefined {
    if (container === undefined || path.length === 0) {
      return container;
    }

    let current: Slot | undefined = container;
    for (const key of path) {
      if (!isContainerSlot(current)) {
        return undefined;
      }

      current = current.v[key];
    }

    return current;
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
