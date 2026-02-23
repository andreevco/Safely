const BIGINT_TAG = '$$bigint$$';

export const replacer = (_: string, value: unknown) => {
    if (typeof value === 'bigint') {
        return {
            [BIGINT_TAG]: value.toString()
        };
    }

    return value;
};

export const reviver = (_: string, value: unknown) => {
    if (value && typeof value === 'object') {
        if (BIGINT_TAG in value && typeof value[BIGINT_TAG] === 'string') {
            return BigInt(value[BIGINT_TAG]);
        }
    }

    return value;
};

export const serialize = (data: unknown) => JSON.stringify(data, replacer);
export const deserialize = <T>(text: string) => JSON.parse(text, reviver) as T;
