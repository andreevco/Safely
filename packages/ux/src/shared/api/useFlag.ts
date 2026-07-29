import type { FlagKey } from '@safely/core';

import { useBootConfig } from './useBootConfig';

export function useFlag(key: FlagKey): boolean {
    const { flags } = useBootConfig();

    return flags[key];
}
