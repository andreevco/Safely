import {
    useAccounts,
    useActiveAccountQuery,
    useActivePortfolioEntitiesQuery,
    useBootConfigQuery
} from '@safely/ux';

import { useLockScreenQuery, usePasscode, usePasscodeLockout } from '@mobile/entities/security';

export function RootSuspenseDependencies() {
    useBootConfigQuery();
    useAccounts();
    useActiveAccountQuery();
    usePasscode();
    useLockScreenQuery();
    usePasscodeLockout();
    useActivePortfolioEntitiesQuery();

    return null;
}
