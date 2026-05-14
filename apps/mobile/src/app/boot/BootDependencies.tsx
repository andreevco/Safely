import {
    useAccounts,
    useActiveAccountQuery,
    useActivePortfolioEntitiesQuery,
    useBootConfigQuery
} from '@safely/ux';

import { useLockScreenQuery, usePasscode, usePasscodeLockout } from '@mobile/entities/security';

export function BootDependencies() {
    useBootConfigQuery();
    useAccounts();
    useActiveAccountQuery();
    usePasscode();
    useLockScreenQuery();
    usePasscodeLockout();
    useActivePortfolioEntitiesQuery();

    return null;
}
