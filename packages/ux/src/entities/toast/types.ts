export interface ToastOptions {
    message: string;
    type?: 'success' | 'error';
    duration?: number;
}

export interface ToastService {
    show(this: void, options: ToastOptions): void;
}
