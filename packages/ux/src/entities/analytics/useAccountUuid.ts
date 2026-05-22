import { useActiveAccountQuery } from '../account/account-state';

export function useAccountUuid(): string | null {
    const { data: activeAccount } = useActiveAccountQuery();

    return activeAccount?.analyticsAccountUuid ?? null;
}
