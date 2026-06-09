import type { ErrorInfo, PropsWithChildren } from 'react';
import { Component } from 'react';

import { logger } from '@mobile/shared/logger';

import { RootErrorFallback } from './RootErrorFallback';

const boundaryLogger = logger.child('root-error-boundary');

type RootErrorBoundaryState = {
    hasError: boolean;
};

export class RootErrorBoundary extends Component<PropsWithChildren, RootErrorBoundaryState> {
    public state: RootErrorBoundaryState = { hasError: false };

    public static getDerivedStateFromError(): RootErrorBoundaryState {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        boundaryLogger.error('fatal', error, errorInfo.componentStack);
    }

    public render() {
        if (this.state.hasError) {
            return <RootErrorFallback />;
        }

        return this.props.children;
    }
}
