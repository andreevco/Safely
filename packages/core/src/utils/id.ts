export abstract class Id {
    public static fromString(s: string): Id {
        return {
            toString(): string {
                return s;
            },
            isEq(id: Id): boolean {
                return id.toString() === s;
            }
        };
    }

    public abstract toString(): string;

    public isEq(id: Id): boolean {
        return this.toString() === id.toString();
    }
}
