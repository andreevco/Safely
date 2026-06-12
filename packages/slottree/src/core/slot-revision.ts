export class SlotRevision {
    constructor(
        private readonly timestamp: number,
        private readonly author: string
    ) {
        this.timestamp = timestamp;
        this.author = author;
    }

    public compare(other: SlotRevision): number {
        if (this.timestamp !== other.timestamp) {
            return this.timestamp - other.timestamp;
        }

        return this.author.localeCompare(other.author);
    }
}
