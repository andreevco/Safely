import {
    useAccounts,
    useActiveAccountQuery,
    useActivePortfolioEntitiesIdsQuery,
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
    useActivePortfolioEntitiesIdsQuery();

    return null;
}
