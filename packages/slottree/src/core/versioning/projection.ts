import type { z } from 'zod';

import { createContainerSlot, type ContainerSlot } from '../slots';
import {
    createProjectionBuilder,
    projectShape,
    type AnyObject,
    type AnySchema,
    type ProjectionBuilder,
    type ProjectionShape,
    type RuntimeRule,
    type SlotProjection
} from './projection/index';
import { stripSlot } from '../slots/slot-json';
import { validateSlot } from '../slots/slot-validation';

export type {
    CopyRule,
    DefaultRule,
    FieldProjectionRule,
    FromRule,
    ObjectFromRule,
    ProjectionBuilder,
    ProjectionMap,
    ProjectionShape,
    ProjectionValue,
    RecordFromRule,
    SlotProjection
} from './projection/index';

export function projection<
    FromSchema extends AnySchema,
    ToSchema extends AnySchema,
    From extends AnyObject = z.output<FromSchema> extends AnyObject ? z.output<FromSchema> : never,
    To extends AnyObject = z.output<ToSchema> extends AnyObject ? z.output<ToSchema> : never
>(
    fromSchema: FromSchema,
    toSchema: ToSchema,
    build: (s: ProjectionBuilder<From>) => ProjectionShape<From, To>
): SlotProjection<From, To> {
    const builder = createProjectionBuilder<From>();
    const shape = build(builder);

    const project = ((source: ContainerSlot): ContainerSlot => {
        validateSlot(source);

        const projectedValues = projectShape(source, shape as Record<string, RuntimeRule>);

        const projected = createContainerSlot(source.t, source.a, projectedValues);

        validateSlot(projected);
        toSchema.parse(stripSlot(projected));

        return projected;
    }) as SlotProjection<From, To>;

    Object.defineProperties(project, {
        fromSchema: {
            value: fromSchema,
            enumerable: true
        },
        toSchema: {
            value: toSchema,
            enumerable: true
        },
        shape: {
            value: shape,
            enumerable: true
        }
    });

    return project;
}
