import type { z } from 'zod';

import { PatchCursor } from './cursor';
import { createPatchDraft } from './draft';
import type { PatchDraft, SlotPatch } from './types';
import type { ContainerSlot } from '../../slots';
import { cloneSlot, stripSlot } from '../../slots/slot-json';
import { validateSlot } from '../../slots/slot-validation';

export function patch<
    FromSchema extends z.ZodTypeAny,
    ToSchema extends z.ZodTypeAny,
    From extends z.output<FromSchema> = z.output<FromSchema>,
    To extends z.output<ToSchema> = z.output<ToSchema>
>(
    fromSchema: FromSchema,
    toSchema: ToSchema,
    build: (draft: PatchDraft<From>) => PatchDraft<To>
): SlotPatch<From, To> {
    const applyPatch = ((source: ContainerSlot): ContainerSlot => {
        validateSlot(source);
        fromSchema.parse(stripSlot(source));

        const target = cloneSlot(source);
        build(createPatchDraft<From>(PatchCursor.root(target)));

        validateSlot(target);
        toSchema.parse(stripSlot(target));

        return target;
    }) as SlotPatch<From, To>;

    Object.defineProperties(applyPatch, {
        fromSchema: {
            value: fromSchema,
            enumerable: true
        },
        toSchema: {
            value: toSchema,
            enumerable: true
        }
    });

    return applyPatch;
}
