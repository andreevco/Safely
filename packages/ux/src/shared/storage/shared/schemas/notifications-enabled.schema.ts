import z from 'zod';

export const sNotificationsEnabled = z.union([z.null(), z.boolean()]);
