import { DeepReadonly, WriteDraft } from "./json";
import { MergeProtocol, MergeStats } from "./merge-protocol";
import {
  ContainerSlot,
  createOriginContainer,
  isContainerSlot,
  Slot,
} from "./slots";
import { cloneDeep, stripSlot } from "./slots/slot-json";
import { validateSlot } from "./slots/slot-validation";
import { StorageVersion } from "./versioning/version";
import {
  createReadProxy,
  createWriteProxy,
  JsonStorageSelection,
  selectJsonStorage,
} from "./write";
import { VersionPropagation } from "./versioning/version-propagation";

export class WorkingStorageRoot {
  constructor(
    private readonly root: ContainerSlot,
    private readonly versions: readonly StorageVersion[],
  ) {}

  update<T>(
    fn: (draft: WriteDraft<T>) => void,
    timestamp: number,
    author: string,
    protocol: MergeProtocol,
  ): boolean {
    let updated = false;
    const draft = createWriteProxy(
      selectJsonStorage(this.latestContainer(), timestamp, author),
      () => {
        updated = true;
      },
    ) as WriteDraft<T>;

    fn(draft);

    this.validateLatest();
    new VersionPropagation(this.versions).propagateToOlderVersions(
      this.root,
      protocol,
    );

    return updated;
  }

  merge(protocol: MergeProtocol, incoming: Slot): MergeStats {
    validateSlot(incoming);

    const before = cloneDeep(this.root);
    const stats = protocol.merge(this.root, incoming);

    const propagation = new VersionPropagation(this.versions);
    propagation.propagateChangedOlderVersionsToNewer(
      before,
      this.root,
      protocol,
    );

    this.validateLatest();
    propagation.propagateToOlderVersions(this.root, protocol);

    return stats;
  }

  get<T>(): T {
    const value = stripSlot(this.latestContainer());

    return this.latestVersion().schema.parse(value) as T;
  }

  read<T>(): DeepReadonly<T> {
    return createReadProxy(
      new JsonStorageSelection(this.latestContainer(), 0, ""),
    ) as DeepReadonly<T>;
  }

  result(): ContainerSlot {
    return this.root;
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
}
