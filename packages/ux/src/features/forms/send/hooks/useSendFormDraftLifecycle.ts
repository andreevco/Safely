import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { resolveBtcWallet, useActivePortfolioEntitiesQuery } from '../../../../entities';
import { sendFormKeys } from '../keys';

export function useSendFormDraftLifecycle(): void {
    const queryClient = useQueryClient();
    const { data: entities } = useActivePortfolioEntitiesQuery();
    const activeWalletId = entities ? resolveBtcWallet(entities.portfolio).id.toString() : null;
    const walletIdRef = useRef(activeWalletId);

    useEffect(() => {
        if (walletIdRef.current === activeWalletId) return;

        walletIdRef.current = activeWalletId;

        if (activeWalletId === null) return;

        queryClient.removeQueries({ queryKey: sendFormKeys.draft.toKey() });
    }, [activeWalletId, queryClient]);
}
