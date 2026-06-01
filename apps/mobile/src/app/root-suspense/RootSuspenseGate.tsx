import type { PropsWithChildren, ReactNode } from 'react';
import { Suspense } from 'react';

import { RootSuspenseDependencies } from './RootSuspenseDependencies';

type RootSuspenseGateProps = PropsWithChildren<{
    fallback?: ReactNode;
}>;

export function RootSuspenseGate(props: RootSuspenseGateProps) {
    const { children, fallback = null } = props;

    return (
        <Suspense fallback={fallback}>
            <RootSuspenseDependencies />
            {children}
        </Suspense>
    );
}
