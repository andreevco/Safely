import { ContainerSlot, createOriginContainer, Slot } from "./slots";
import { cloneSlot } from "./slots/slot-json";
import { validateSlot } from "./slots/slot-validation";
import {
  AssertVersionHList,
  HCons,
  hListToRuntimeArray,
  NewOf,
  StorageVersion,
} from "./versioning/version";
import { DeepReadonly, WriteDraft } from "./json";
import { MergeProtocol, MergeStats } from "./merge-protocol";
import { WorkingStorageRoot } from "./working-storage-root";
import { z } from "zod";
import { VersionController } from "./versioning/version-controller";

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
    return this.committedRoot().get<T>();
  }

  read(): DeepReadonly<T> {
    return this.committedRoot().read<T>();
  }

  update(fn: (draft: WriteDraft<T>) => void): void {
    const timestamp = this.protocol.tick();
    const author = this.protocol.id;

    const workingRoot = this.createWorkingRoot();

    workingRoot.update(fn, timestamp, author, this.protocol);
    this.root = workingRoot.result();
  }

  merge(incoming: Slot): MergeStats {
    const workingRoot = this.createWorkingRoot();
    const validationProtocol = new MergeProtocol(this.protocol.id);
    validationProtocol.observeTree(this.root);
    const stats = workingRoot.merge(validationProtocol, incoming);

    this.root = workingRoot.result();
    this.protocol.observeTree(incoming);
    this.protocol.observeTree(this.root);
    return stats;
  }

  export(): Slot {
    return cloneSlot(this.root);
  }

  private committedRoot(): WorkingStorageRoot {
    return new WorkingStorageRoot(this.root, this.versions);
  }

  private createWorkingRoot(): WorkingStorageRoot {
    return new WorkingStorageRoot(cloneSlot(this.root), this.versions);
  }

  private latestVersion(): StorageVersion {
    const latest = this.versions[this.versions.length - 1];

    if (latest === undefined) {
      throw new Error("Storage must have at least one version");
    }

    return latest;
  }

  private ensureLatestInitialized(): void {
    const latest = this.latestVersion();
    const controller = new VersionController(this.root, this.versions);

    if (controller.get(latest) !== undefined) {
      this.committedRoot().get<T>();
      return;
    }

    for (let index = this.versions.length - 2; index >= 0; index -= 1) {
      const version = this.versions[index];

      if (controller.createVersionFrom(version) !== undefined) {
        this.committedRoot().get<T>();
        return;
      }
    }

    controller.createInitialVersion();
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
