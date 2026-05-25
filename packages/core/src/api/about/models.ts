import { z } from 'zod';

import type { BootParams } from '../boot/models';

export type AboutParams = BootParams;

export const taggedTextPostSchema = z.object({
    type: z.literal('taggedTextPost'),
    id: z.string(),
    timestamp: z.number(), // Unix seconds
    tagged_text: z.string(),
    links: z.record(z.string(), z.string()).optional()
});

export const externalLinkPostSchema = z.object({
    type: z.literal('externalLinkPost'),
    id: z.string(),
    timestamp: z.number(), // Unix seconds
    title: z.string(),
    description: z.string(),
    url: z.string(),
    img_url: z.string().optional()
});

export const aboutPostSchema = z.discriminatedUnion('type', [
    taggedTextPostSchema,
    externalLinkPostSchema
]);

export const aboutSchema = z.object({
    posts: z.array(aboutPostSchema)
});

export type TaggedTextPost = z.infer<typeof taggedTextPostSchema>;
export type ExternalLinkPost = z.infer<typeof externalLinkPostSchema>;
export type AboutPost = z.infer<typeof aboutPostSchema>;
export type About = z.infer<typeof aboutSchema>;
