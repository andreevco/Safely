import {
    useAccounts,
    useActiveAccountQuery,
    useActivePortfolioEntitiesQuery,
    useBootConfigQuery
} from '@safely/ux';

import { useLockScreenQuery, usePasscode, usePasscodeLockout } from '@mobile/entities/security';

export function BootDependencies() {
    const { data: activeAccount } = useActiveAccountQuery();

    useBootConfigQuery();
    useAccounts();
    usePasscode();
    useLockScreenQuery();
    usePasscodeLockout();

    if (activeAccount) {
        return <AccountBootDependencies />;
    }

    return null;
}

function AccountBootDependencies() {
    useActivePortfolioEntitiesQuery();

    return null;
}
