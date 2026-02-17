export interface Security {
    check(options?: { title?: string }): Promise<void>;
}
