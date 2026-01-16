export { finalKey } from './types';
export type { FinalKey, JsonPrimitive, JsonValue, QueryKeys } from './types';

import type { Definition, DefinitionMethod, KeyPath, QueryKeys as QueryKeysType } from './types';
import { finalKey } from './types';
import { createKeyResult, flattenArgs, toKeyPart } from './utils';

export function mappedParams<T extends (...args: never[]) => unknown>(
    callback: T,
    mapper: (...args: Parameters<T>) => readonly unknown[]
): T & { paramsMapper: typeof mapper } {
    const result = (...args: Parameters<T>) => callback(...args) as ReturnType<T>;
    result.paramsMapper = mapper;

    return result as T & { paramsMapper: typeof mapper };
}

export function defineQueryKeys<D extends string, Def extends object>(
    domain: D,
    definition: Def
): QueryKeysType<D, Def> {
    if (!definition || Object.keys(definition).length === 0) {
        return {
            toKey: () => [domain] as const
        } as QueryKeysType<D, Def>;
    }

    return build(domain, definition as Definition, []) as QueryKeysType<D, Def>;
}

function build(domain: string, definition: Definition, basePath: KeyPath): Record<string, unknown> {
    const result: Record<string, unknown> = {
        toKey: () => [domain, ...basePath]
    };

    Object.entries(definition).forEach(([name, value]) => {
        const path = [...basePath, name];

        if (value === finalKey) {
            result[name] = createKeyResult([domain, ...path]);
        } else if (Array.isArray(value)) {
            result[name] = createKeyResult([domain, ...path, ...value.map(toKeyPart)]);
        } else if (typeof value === 'function') {
            result[name] = buildMethod(domain, value, path);
        } else if (typeof value === 'object' && value !== null) {
            const nested = build(domain, value as Definition, path);
            result[name] = Object.assign(nested, createKeyResult([domain, ...path]));
        }
    });

    return result;
}

function buildMethod(
    domain: string,
    method: DefinitionMethod,
    basePath: KeyPath
): ((...args: readonly unknown[]) => unknown) & ReturnType<typeof createKeyResult> {
    const fn = (...args: readonly unknown[]) => {
        const mapped = method.paramsMapper
            ? (method.paramsMapper as (...p: readonly unknown[]) => readonly unknown[])(...args)
            : args;
        const argParts = flattenArgs(mapped);
        const pathWithArgs = [...basePath, ...argParts];

        const returned = (method as (...a: readonly unknown[]) => unknown)(...args);

        if (returned === finalKey) {
            return createKeyResult([domain, ...pathWithArgs]);
        }

        if (Array.isArray(returned)) {
            return createKeyResult([domain, ...pathWithArgs, ...returned.map(toKeyPart)]);
        }

        const nested = build(domain, returned as Definition, pathWithArgs);

        return Object.assign(nested, createKeyResult([domain, ...pathWithArgs]));
    };

    return Object.assign(fn, createKeyResult([domain, ...basePath]));
}
