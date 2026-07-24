import { useFlag } from '@safely/ux';

export function useIsAppRestricted(): boolean {
    return useFlag('enable_app_restrictions');
}

export function useIsAppUnrestricted(): boolean {
    return !useFlag('enable_app_restrictions');
}
