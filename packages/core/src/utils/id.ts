export abstract class Id {
    public static fromString(s: string): Id {
        return {
            toString(): string {
                return s;
            },
            isEq(id: Id): boolean {
                return id.toString() === s;
            }
        } as Id;
    }

    public abstract toString(): string;

    public isEq(id: Id): boolean {
        // eslint-disable-next-line iseq/no-strict-eq-when-isEq
        return this.toString() === id.toString();
    }

    protected of(...items: (string | number | { toString: () => string })[]): string {
        return items.map(i => i.toString()).join(':');
    }
}
