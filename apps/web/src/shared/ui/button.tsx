import * as React from 'react';

import { cn } from './cn';

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
    default: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
    destructive: 'bg-red-600 text-white hover:bg-red-500',
    ghost: 'bg-transparent text-zinc-900 hover:bg-zinc-100'
};

const sizeClasses: Record<ButtonSize, string> = {
    default: 'h-10 px-4 text-sm',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-6 text-base'
};

export function Button({
    className,
    variant = 'default',
    size = 'default',
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        />
    );
}
