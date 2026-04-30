import {
  createContainerSlot,
  isContainerSlot,
  type ContainerSlot,
  type Slot,
  type SlotMap,
} from "../../slots";
import { cloneSlot } from "../../slots/slot-json";
import { createProjectionBuilder } from "./builder";
import {
  applyMap,
  projectionValueToSlot,
  resolveDefaultValue,
} from "./values";
import type {
  AnyObject,
  CopyRule,
  DefaultRule,
  FromRule,
  ObjectFromRule,
  ProjectionValue,
  RecordFromRule,
} from "./types";

export type RuntimeRule =
  | CopyRule<unknown>
  | FromRule<string, unknown>
  | DefaultRule<ProjectionValue>
  | ObjectFromRule<string, AnyObject>
  | RecordFromRule<string, Record<string, AnyObject>>;

export function projectShape(
  source: ContainerSlot,
  shape: Record<string, RuntimeRule>,
): SlotMap {
  const projectedValues: SlotMap = {};

  for (const targetKey of Object.keys(shape)) {
    const rule = shape[targetKey];

    if (rule === undefined) {
      continue;
    }

    const projectedSlot = applyRule(source, targetKey, rule);

    if (projectedSlot !== undefined) {
      projectedValues[targetKey] = projectedSlot;
    }
  }

  return projectedValues;
}

function applyRule(
  source: ContainerSlot,
  targetKey: string,
  rule: RuntimeRule,
): Slot | undefined {
  switch (rule.kind) {
    case "copy": {
      const sourceSlot = source.v[targetKey];

      if (rule.map !== undefined) {
        return applyMap(sourceSlot, rule.map);
      }

      return sourceSlot === undefined ? undefined : cloneSlot(sourceSlot);
    }

    case "from": {
      const sourceSlot = source.v[rule.key];

      if (rule.map !== undefined) {
        return applyMap(sourceSlot, rule.map);
      }

      return sourceSlot === undefined ? undefined : cloneSlot(sourceSlot);
    }

    case "default": {
      const value = resolveDefaultValue(rule.value);
      return projectionValueToSlot(value, { t: 0, a: "" });
    }

    case "objectFrom": {
      const sourceSlot = source.v[rule.key];

      if (sourceSlot === undefined) {
        return undefined;
      }

      if (sourceSlot.d === true) {
        return cloneSlot(sourceSlot);
      }

      if (!isContainerSlot(sourceSlot)) {
        throw new Error(
          `Cannot project object field "${rule.key}" because source slot is not a container`,
        );
      }

      const projectedValues = projectShape(
        sourceSlot,
        rule.shape as Record<string, RuntimeRule>,
      );

      return createContainerSlot(sourceSlot.t, sourceSlot.a, projectedValues);
    }

    case "recordFrom": {
      const sourceKey = rule.key ?? targetKey;
      const sourceSlot = source.v[sourceKey];

      if (sourceSlot === undefined) {
        return undefined;
      }

      if (sourceSlot.d === true) {
        return cloneSlot(sourceSlot);
      }

      if (!isContainerSlot(sourceSlot)) {
        throw new Error(
          `Cannot project record field "${sourceKey}" because source slot is not a container`,
        );
      }

      const projectedRecordValues: SlotMap = {};

      for (const recordKey of Object.keys(sourceSlot.v)) {
        const sourceRecordValue = sourceSlot.v[recordKey];

        if (sourceRecordValue === undefined) {
          continue;
        }

        if (sourceRecordValue.d === true) {
          projectedRecordValues[recordKey] = cloneSlot(sourceRecordValue);
          continue;
        }

        if (!isContainerSlot(sourceRecordValue)) {
          throw new Error(
            `Cannot project record item "${sourceKey}.${recordKey}" because source record value is not a container`,
          );
        }

        const nestedBuilder = createProjectionBuilder<AnyObject>();
        const itemShape = rule.build(recordKey, nestedBuilder);

        const projectedItemValues = projectShape(
          sourceRecordValue,
          itemShape as Record<string, RuntimeRule>,
        );

        projectedRecordValues[recordKey] = createContainerSlot(
          sourceRecordValue.t,
          sourceRecordValue.a,
          projectedItemValues,
        );
      }

      return createContainerSlot(
        sourceSlot.t,
        sourceSlot.a,
        projectedRecordValues,
      );
    }
  }
}
