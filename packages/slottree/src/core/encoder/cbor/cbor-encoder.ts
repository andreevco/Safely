import { decodeCbor } from './decode';
import { encodeCbor } from './encode';
import type { ContainerSlot } from '../../slots';

export class CborEncoder {
    constructor(private readonly stringEncoding: BufferEncoding) {}

    public encode(root: ContainerSlot): string {
        return this.encodeBinary(root).toString(this.stringEncoding);
    }

    public decode(encodedRoot: string): ContainerSlot {
        return this.decodeBinary(Buffer.from(encodedRoot, this.stringEncoding));
    }

    public encodeBinary(root: ContainerSlot): Buffer {
        return encodeCbor(root);
    }

    public decodeBinary(data: Buffer): ContainerSlot {
        return decodeCbor(data);
    }
}

export const cborEncoder = new CborEncoder('base64url');
