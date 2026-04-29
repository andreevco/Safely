import { MergeProtocol } from "./merge-protocol";
import { stripSlot } from "./slots/slot-json";
import { ContainerSlot, isContainerSlot, Slot } from "./slots";
import { validateSlot } from "./slots/slot-validation";
import { StorageVersion } from "./version";

export class VersionPropagation {
  constructor(private readonly versions: readonly StorageVersion[]) {}

  propagateChangedOlderVersionsToNewer(
    before: ContainerSlot,
    root: ContainerSlot,
    protocol: MergeProtocol,
  ): void {
    const knownVersionsLength = Object.keys(root.v).length;
    if (knownVersionsLength <= 1) {
      return;
    }

    let current: ContainerSlot | undefined;

    for (let index = 0; index < this.versions.length - 1; index += 1) {
      const fromVersion = this.versions[index];
      const toVersion = this.versions[index + 1];

      if (current === undefined) {
        const source = root.v[String(fromVersion.version)];
        const previousSource = before.v[String(fromVersion.version)];

        if (
          !isContainerSlot(source) ||
          this.slotEquals(source, previousSource)
        ) {
          continue;
        }

        current = source;
      }

      const projected = toVersion.projectUp(current);
      this.validateProjection(toVersion, projected);
      current = this.mergeIntoExistingVersion(
        root,
        toVersion,
        projected,
        protocol,
      );
    }
  }

  propagateToOlderVersions(root: ContainerSlot, protocol: MergeProtocol): void {
    const latestVersion = this.latestVersion();
    const knownVersionsLength = Object.keys(root.v).filter(
      (x) => Number(x) <= latestVersion.version,
    ).length;

    if (knownVersionsLength <= 1) {
      return;
    }

    const latest = root.v[String(latestVersion.version)];
    if (!isContainerSlot(latest)) {
      return;
    }

    let current = latest;

    for (let index = this.versions.length - 1; index > 0; index -= 1) {
      const fromVersion = this.versions[index];
      const toVersion = this.versions[index - 1];

      const projected = fromVersion.projectDown(current);
      this.validateProjection(toVersion, projected);
      current = this.mergeIntoExistingVersion(
        root,
        toVersion,
        projected,
        protocol,
      );
    }
  }

  private latestVersion(): StorageVersion {
    const latest = this.versions[this.versions.length - 1];

    if (latest === undefined) {
      throw new Error("Storage must have at least one version");
    }

    return latest;
  }

  private mergeIntoExistingVersion(
    root: ContainerSlot,
    version: StorageVersion,
    projected: ContainerSlot,
    protocol: MergeProtocol,
  ): ContainerSlot {
    const target = root.v[String(version.version)];

    if (isContainerSlot(target)) {
      protocol.merge(target, projected);
      return target;
    }

    return projected;
  }

  private validateProjection(
    version: StorageVersion,
    projected: ContainerSlot,
  ): void {
    validateSlot(projected);
    version.schema.parse(stripSlot(projected));
  }

  private slotEquals(left: Slot, right: Slot | undefined): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }
}
