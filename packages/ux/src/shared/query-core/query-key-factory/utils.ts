import type { JsonObject, JsonValue, KeyPart, KeyResult } from './types';

export function normalizeJson(value: JsonValue | bigint): JsonValue {
    if (Array.isArray(value)) {
        return value.map(normalizeJson);
    }

    if (value !== null && typeof value === 'object') {
        const obj = value as JsonObject;
        const result: Record<string, JsonValue> = {};

        Object.entries(obj)
            .sort(([a], [b]) => compareStrings(a, b))
            .forEach(([key, val]) => (result[key] = normalizeJson(val)));

        return result;
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    return value;
}

export function toKeyPart(value: unknown): KeyPart {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    return JSON.stringify(normalizeJson(value as JsonValue));
}

export function flattenArgs(args: readonly unknown[]): KeyPart[] {
    const result: KeyPart[] = [];

    args.forEach(arg => {
        if (Array.isArray(arg)) {
            arg.forEach(item => {
                result.push(toKeyPart(item));
            });
        } else {
            result.push(toKeyPart(arg));
        }
    });

    return result;
}

export function createKeyResult(key: readonly unknown[]): KeyResult {
    return { key, toKey: () => key };
}

// String.localeCompare may produce inconsistent results across different browsers and environments.
// `<` and `>` JavaScript operators compare UTF-16 endpoints without locale-specific rules, so this
// function should be consistent between different implementations.
function compareStrings(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}
