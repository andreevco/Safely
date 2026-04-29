import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { useActiveBtcWallet } from '../../../../entities';
import { SEND_FORM_DRAFT_TTL, SendFormDraft } from '../../../../shared';
import { sendFormKeys } from '../keys';

export function useSendFormDraft() {
    const wallet = useActiveBtcWallet();
    const queryClient = useQueryClient();
    const walletId = wallet.id.toString();

    const draftKey = useMemo(() => sendFormKeys.draft(walletId).toKey(), [walletId]);

    useEffect(() => {
        queryClient.setQueryDefaults(draftKey, {
            meta: {
                persist: true,
                schemaKey: 'sendFormDraft'
            }
        });
    }, [queryClient, draftKey]);

    const initialDraft = useMemo(() => {
        const state = queryClient.getQueryState<SendFormDraft>(draftKey);
        if (!state?.data) return undefined;

        if (Date.now() - state.dataUpdatedAt > SEND_FORM_DRAFT_TTL) {
            queryClient.removeQueries({ queryKey: draftKey });

            return undefined;
        }

        return state.data;
    }, []);

    const saveDraft = useCallback(
        (data: SendFormDraft) => {
            queryClient.setQueryData<SendFormDraft>(draftKey, data);
        },
        [queryClient, draftKey]
    );

    const clearDraft = useCallback(() => {
        queryClient.removeQueries({
            queryKey: draftKey
        });
    }, [queryClient, draftKey]);

    return {
        saveDraft,
        clearDraft,
        initialDraft
    };
}
