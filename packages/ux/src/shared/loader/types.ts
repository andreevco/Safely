export interface LoaderService {
    show(this: void): void;
    hide(this: void): void;
    withLoader<T>(this: void, callback: () => Promise<T>): Promise<T>;
}

export const noopLoaderService: LoaderService = {
    show() {
        /* empty */
    },
    hide() {
        /* empty */
    },
    async withLoader<T>(callback: () => Promise<T>): Promise<T> {
        return callback();
    }
};
