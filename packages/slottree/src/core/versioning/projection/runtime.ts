import { createProjectionBuilder } from './builder';
import type {
    AnyObject,
    CopyRule,
    DefaultRule,
    FromRule,
    MapRule,
    ObjectFromRule,
    ProjectionValue,
    RecordFromRule
} from './types';
import { applyMap, projectionValueToSlot, resolveDefaultValue } from './values';
import {
    createContainerSlot,
    createSlotMap,
    isContainerSlot,
    type ContainerSlot,
    type Slot,
    type SlotMap
} from '../../slots';
import { cloneSlot } from '../../slots/slot-json';

export type RuntimeRule =
    | CopyRule
    | FromRule<string>
    | MapRule<string | undefined, ProjectionValue>
    | DefaultRule<ProjectionValue>
    | ObjectFromRule<string, AnyObject>
    | RecordFromRule<string, Record<string, AnyObject>>;

export function projectShape(source: ContainerSlot, shape: Record<string, RuntimeRule>): SlotMap {
    const projectedValues: SlotMap = createSlotMap();

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

function applyRule(source: ContainerSlot, targetKey: string, rule: RuntimeRule): Slot | undefined {
    switch (rule.kind) {
        case 'copy': {
            const sourceSlot = source.v[targetKey];

            return sourceSlot === undefined ? undefined : cloneSlot(sourceSlot);
        }

        case 'from': {
            const sourceSlot = source.v[rule.key];

            return sourceSlot === undefined ? undefined : cloneSlot(sourceSlot);
        }

        case 'map': {
            return applyMap(source.v[rule.key ?? targetKey], rule.map);
        }

        case 'default': {
            const value = resolveDefaultValue(rule.value);
            return projectionValueToSlot(value, { t: 0, a: '' });
        }

        case 'objectFrom': {
            return applyObjectFromRule(source, rule);
        }

        case 'recordFrom': {
            return applyRecordFromRule(source, targetKey, rule);
        }
    }
}

function applyObjectFromRule(
    source: ContainerSlot,
    rule: ObjectFromRule<string, AnyObject>
): Slot | undefined {
    const sourceSlot = source.v[rule.key];

    if (sourceSlot === undefined) {
        return undefined;
    }

    if (sourceSlot.d === true) {
        return cloneSlot(sourceSlot);
    }

    if (!isContainerSlot(sourceSlot)) {
        throw new Error(
            `Cannot project object field "${rule.key}" because source slot is not a container`
        );
    }

    const projectedValues = projectShape(sourceSlot, rule.shape as Record<string, RuntimeRule>);

    return createContainerSlot(sourceSlot.t, sourceSlot.a, projectedValues);
}

function applyRecordFromRule(
    source: ContainerSlot,
    targetKey: string,
    rule: RecordFromRule<string, Record<string, AnyObject>>
): Slot | undefined {
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
            `Cannot project record field "${sourceKey}" because source slot is not a container`
        );
    }

    const projectedRecordValues: SlotMap = createSlotMap();

    for (const recordKey of Object.keys(sourceSlot.v)) {
        const projectedRecordValue = projectRecordValue(
            sourceKey,
            recordKey,
            sourceSlot.v[recordKey],
            rule
        );

        if (projectedRecordValue !== undefined) {
            projectedRecordValues[recordKey] = projectedRecordValue;
        }
    }

    return createContainerSlot(sourceSlot.t, sourceSlot.a, projectedRecordValues);
}

function projectRecordValue(
    sourceKey: string,
    recordKey: string,
    sourceRecordValue: Slot | undefined,
    rule: RecordFromRule<string, Record<string, AnyObject>>
): Slot | undefined {
    if (sourceRecordValue === undefined) {
        return undefined;
    }

    if (sourceRecordValue.d === true) {
        return cloneSlot(sourceRecordValue);
    }

    if (!isContainerSlot(sourceRecordValue)) {
        throw new Error(
            `Cannot project record item "${sourceKey}.${recordKey}" because source record value is not a container`
        );
    }

    const nestedBuilder = createProjectionBuilder<AnyObject>();
    const itemShape = rule.build(recordKey, nestedBuilder);

    const projectedItemValues = projectShape(
        sourceRecordValue,
        itemShape as Record<string, RuntimeRule>
    );

    return createContainerSlot(sourceRecordValue.t, sourceRecordValue.a, projectedItemValues);
}
