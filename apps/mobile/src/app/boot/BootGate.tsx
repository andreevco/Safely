import { PropsWithChildren, ReactNode, Suspense } from 'react';

import { BootDependencies } from './BootDependencies';

type BootGateProps = PropsWithChildren<{
    fallback?: ReactNode;
}>;

export function BootGate(props: BootGateProps) {
    const { children, fallback = null } = props;

    return (
        <Suspense fallback={fallback}>
            <BootDependencies />
            {children}
        </Suspense>
    );
}
