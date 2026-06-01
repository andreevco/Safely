export type ConfirmationState =
    | { type: 'idle' }
    | { type: 'sending' }
    | { type: 'success' }
    | { type: 'error'; error: unknown }
    | { type: 'estimateError'; error: unknown };
