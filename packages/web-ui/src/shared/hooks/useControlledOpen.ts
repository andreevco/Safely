import { useCallback } from 'react';

export type ControlledOpenProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function useControlledOpen({ isOpen, onOpenChange }: ControlledOpenProps) {
    const open = useCallback(() => onOpenChange(true), [onOpenChange]);
    const close = useCallback(() => onOpenChange(false), [onOpenChange]);

    return { isOpen, open, close };
}
