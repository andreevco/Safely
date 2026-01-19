export interface QrScanner {
    scan(options?: { titleTranslationKey?: string; subTranslationKey?: string }): Promise<string>;
}
