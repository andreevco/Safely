import { SPACE } from '@safely/core';

const NON_STANDARD_SPACES = new RegExp(
    `[${SPACE.NBSP}${SPACE.FSP}${SPACE.NNBSP}${SPACE.THSP}]`,
    'g'
);

export const normalizeInput = (str: string) =>
    str
        .normalize()
        .replace(NON_STANDARD_SPACES, ' ')
        .replace(/[0-9.]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(s => s.toLowerCase());
