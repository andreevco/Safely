export function utf8(s: string): Uint8Array {
    return new TextEncoder().encode(s);
}

export function bytesToUtf8(b: Uint8Array): string {
    return new TextDecoder().decode(b);
}

export function bytesToHex(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('hex');
}

export function hexToBytes(hex: string): Uint8Array {
    return Buffer.from(hex, 'hex');
}

export function u64be(num: bigint | number): Buffer {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(typeof num === 'number' ? BigInt(num) : num);
    return buf;
}

export function u32be(num: number): Buffer {
    if (num < 0 || num > 4294967295) {
        throw new RangeError('u32 value must be between 0 and 4294967295');
    }
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(num);
    return buf;
}

export function u16be(num: number): Buffer {
    if (num < 0 || num > 65535) {
        throw new RangeError('u16 value must be between 0 and 65535');
    }
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(num);
    return buf;
}

export function u8be(num: number): Buffer {
    if (num < 0 || num > 255) {
        throw new RangeError('u8 value must be between 0 and 255');
    }
    const buf = Buffer.alloc(1);
    buf.writeUInt8(num);
    return buf;
}
