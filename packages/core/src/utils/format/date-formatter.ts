export class DateFormatter {
    constructor(private readonly locale: string) {}

    public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
        return date.toLocaleDateString(this.locale, options);
    }
}
