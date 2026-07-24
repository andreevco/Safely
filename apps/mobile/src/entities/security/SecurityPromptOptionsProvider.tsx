import type { PropsWithChildren, RefObject } from 'react';
import { createContext, useContext, useRef } from 'react';

import type { PromptAndCheckOptions } from './types';

const SecurityPromptOptionsContext = createContext<RefObject<
    PromptAndCheckOptions | undefined
> | null>(null);

export const SecurityPromptOptionsProvider = ({ children }: PropsWithChildren) => {
    const ref = useRef<PromptAndCheckOptions | undefined>(undefined);

    return <SecurityPromptOptionsContext value={ref}>{children}</SecurityPromptOptionsContext>;
};

export function useSecurityPromptOptions() {
    const ref = useContext(SecurityPromptOptionsContext);

    if (!ref) {
        throw new Error(
            'useSecurityPromptOptions must be used within SecurityPromptOptionsProvider'
        );
    }

    return ref;
}
