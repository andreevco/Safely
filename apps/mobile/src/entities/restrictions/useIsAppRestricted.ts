import { useFlag } from '@safely/ux';

export function useIsAppRestricted(): boolean {
    return useFlag('enable_app_restrictions');
}
