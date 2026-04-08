import { u8be } from './buffer';

export class TLVWriter {
    private readonly chunks: Buffer[] = [];
    private totalLength = 0;

    public write(type: number, data: Buffer): void {
        this.chunks.push(Buffer.concat([u8be(type), u8be(data.length), data]));
        this.totalLength += 2 + data.length;
    }

    public concat(): Buffer {
        return Buffer.concat(this.chunks);
    }
}

export class TLVReader {
    private offset = 0;

    constructor(private readonly data: Buffer) {}

    public readNext(): { type: number; value: Buffer } | null {
        if (this.offset + 2 > this.data.length) return null;

        const type = this.data[this.offset];
        const length = this.data[this.offset + 1];

        if (this.offset + 2 + length > this.data.length) return null;

        const value = this.data.slice(this.offset + 2, this.offset + 2 + length);
        this.offset += 2 + length;
        return { type, value };
    }

    public readAll(): { type: number; value: Buffer }[] {
        const records = [];
        let record;
        while ((record = this.readNext()) !== null) {
            records.push(record);
        }
        return records;
    }
}
