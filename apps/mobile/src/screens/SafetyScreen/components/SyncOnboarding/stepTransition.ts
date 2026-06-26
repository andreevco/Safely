export const STEP_OFFSET = 16;

export interface StepLayerValues {
    opacity: number;
    translateX: number;
}

export function getStepDirection(from: number, to: number): 1 | -1 {
    return to >= from ? 1 : -1;
}

export function outgoingTransform(progress: number, direction: number): StepLayerValues {
    'worklet';

    return {
        opacity: 1 - progress,
        translateX: progress * STEP_OFFSET * direction
    };
}

export function incomingTransform(progress: number, direction: number): StepLayerValues {
    'worklet';

    return {
        opacity: progress,
        translateX: (progress - 1) * STEP_OFFSET * direction
    };
}
