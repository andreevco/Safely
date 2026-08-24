import z from 'zod';

export const sHiddenDeviceWarnings = z.union([z.null(), z.record(z.string(), z.number())]);
