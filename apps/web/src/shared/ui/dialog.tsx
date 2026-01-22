import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from './cn';

type DialogContextValue = {
    open: boolean;
    setOpen: (next: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
    const ctx = React.useContext(DialogContext);
    if (!ctx) {
        throw new Error('Dialog components must be used within <Dialog>');
    }
    return ctx;
}

export function Dialog({
    open,
    onOpenChange,
    children
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}) {
    const value = React.useMemo(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);
    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
    children
}: {
    children: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
}) {
    const { setOpen } = useDialogContext();
    return React.cloneElement(children, {
        onClick: e => {
            children.props.onClick?.(e);
            setOpen(true);
        }
    });
}

export function DialogContent({
    className,
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    const { open, setOpen } = useDialogContext();

    React.useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, setOpen]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-black/50"
                onClick={() => setOpen(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    className={cn(
                        'w-full max-w-2xl rounded-xl bg-white p-6 text-zinc-900 shadow-xl',
                        className
                    )}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

export function DialogHeader({
    className,
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={cn('mb-4 space-y-1', className)}>{children}</div>;
}

export function DialogTitle({
    className,
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>;
}

export function DialogDescription({
    className,
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <p className={cn('text-sm text-zinc-600', className)}>{children}</p>;
}

export function DialogFooter({
    className,
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn('mt-6 flex items-center justify-end gap-2', className)}>{children}</div>
    );
}
