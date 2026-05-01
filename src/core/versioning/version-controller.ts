import { JsonValue } from "../json";
import { ContainerSlot, isContainerSlot, Slot } from "../slots";
import { slotFromJson, stripSlot } from "../slots/slot-json";
import { validateSlot } from "../slots/slot-validation";
import { StorageVersion } from "./version";

export type VersionSelector = number | Pick<StorageVersion, "version">;

export class VersionController {
  constructor(
    private readonly root: ContainerSlot,
    private readonly versions: readonly StorageVersion[],
  ) {}

  get(version: VersionSelector): Slot | undefined {
    return this.root.v[this.versionKey(version)];
  }

  createInitialVersion(): ContainerSlot {
    const latest = this.latestVersion();
    const initial =
      typeof latest.initial === "function"
        ? (latest.initial as () => unknown)()
        : latest.initial;
    const parsed = latest.schema.parse(initial);
    const slot = slotFromJson(parsed as JsonValue, 0, "");

    if (!isContainerSlot(slot)) {
      throw new Error("Initial version must be a container");
    }

    this.root.v[this.versionKey(latest)] = slot;
    return slot;
  }

  createVersionFrom(version: VersionSelector): ContainerSlot | undefined {
    const fromIndex = this.versionIndex(version);
    const source = this.get(version);

    if (!isContainerSlot(source)) {
      return undefined;
    }

    let current = source;

    for (let index = fromIndex + 1; index < this.versions.length; index += 1) {
      const toVersion = this.versions[index];
      const projected = toVersion.projectUp(current);
      this.validateProjection(toVersion, projected);
      current = projected;
    }

    this.root.v[this.versionKey(this.latestVersion())] = current;
    return current;
  }

  delete(version: VersionSelector): void {
    delete this.root.v[this.versionKey(version)];
  }

  private latestVersion(): StorageVersion {
    const latest = this.versions[this.versions.length - 1];

    if (latest === undefined) {
      throw new Error("Storage must have at least one version");
    }

    return latest;
  }

  private versionIndex(version: VersionSelector): number {
    const versionNumber =
      typeof version === "number" ? version : version.version;
    const index = this.versions.findIndex(
      (candidate) => candidate.version === versionNumber,
    );

    if (index < 0) {
      throw new Error(`Unknown storage version ${versionNumber}`);
    }

    return index;
  }

  private versionKey(version: VersionSelector): string {
    return String(typeof version === "number" ? version : version.version);
  }

  private validateProjection(
    version: StorageVersion,
    projected: ContainerSlot,
  ): void {
    validateSlot(projected);
    version.schema.parse(stripSlot(projected));
  }
}
