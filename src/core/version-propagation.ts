import { JsonValue } from "./json";
import { stripSlot } from "./slots/slot-json";
import { ContainerSlot, isContainerSlot } from "./slots";
import { StorageVersion } from "./version";
import { JsonStorageSelection, selectJsonStorage } from "./write";

export class VersionPropagation {
  constructor(private readonly versions: readonly StorageVersion[]) {}

  propagateToOlderVersions(
    root: ContainerSlot,
    latest: unknown,
    timestamp: number,
    author: string,
  ): void {
    const latestVersion = this.latestVersion();
    const knownVersionsLength = Object.keys(root.v).filter(
      (x) => Number(x) <= latestVersion.version,
    ).length;

    if (knownVersionsLength <= 1) {
      return;
    }

    let current = latest;

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

  private latestVersion(): StorageVersion {
    const latest = this.versions[this.versions.length - 1];

    if (latest === undefined) {
      throw new Error("Storage must have at least one version");
    }

    return latest;
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
}
