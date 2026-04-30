import Big, { BigSource } from 'big.js';

export function isInteger(val: BigSource | bigint): boolean {
    if (typeof val === 'bigint') {
        return true;
    }

    try {
        const n = Big(val);
        return n.mod(1).eq(0);
    } catch {
        return false;
    }
}

export function toBigInt(val: BigSource | bigint): bigint {
    if (typeof val === 'bigint') {
        return val;
    }

    if (!isInteger(val)) {
        throw new Error('Cannot convert non-integer value to bigint');
    }

    return BigInt(Big(val).toFixed(0));
}

export function toBig(val: BigSource | bigint): Big {
    if (typeof val === 'bigint') {
        return Big(val.toString());
    }

    return Big(val);
}

export function toBigSoft(val: BigSource | bigint | undefined): Big | null {
    if (val === undefined) {
        return null;
    }

    try {
        return toBig(val);
    } catch {
        return null;
    }
}

export function toBigOrZero(val: BigSource | bigint | undefined): Big {
    return toBigSoft(val) ?? Big(0);
}

export function isZero(value: BigSource | bigint): boolean {
    return toBig(value).eq(0);
}

export function abs(val: number): number;
export function abs(val: bigint): bigint;
export function abs(val: number | bigint) {
    if (typeof val === 'bigint') {
        return val < 0n ? -val : val;
    } else {
        return Math.abs(val);
    }
}
