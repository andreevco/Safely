import {
    useAccounts,
    useActiveAccountQuery,
    useActivePortfolioEntitiesIdsQuery,
    useAmountInputType,
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
    useAmountInputType();

    return null;
}
