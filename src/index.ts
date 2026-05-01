export type {
  DeepReadonly,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  Path,
  PathValue,
  WriteDraft,
} from "./core/json";

export { createStorage } from "./core/storage";
export type { Storage } from "./core/storage";

export type { StorageVersion } from "./core/versioning/version";
export {
  DEVICES_KEY,
  VersionController,
} from "./core/versioning/version-controller";
export type { VersionSelector } from "./core/versioning/version-controller";
