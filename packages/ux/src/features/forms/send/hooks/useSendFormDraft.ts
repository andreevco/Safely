import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

import { useActiveBtcWallet } from '../../../../entities';
import { QUERIES_GC_TIME } from '../../../../shared';
import { sendFormKeys } from '../keys';
import { SendFormInitialValues } from '../types';

type SendFormDraft = Required<Pick<SendFormInitialValues, 'recipient'>> &
    Omit<SendFormInitialValues, 'recipient'> & {
        selectedId?: string;
        suggestionIds?: string[];
    };

export function useSendFormDraft() {
    const wallet = useActiveBtcWallet();
    const queryClient = useQueryClient();
    const walletId = wallet.id.toString();

    const draftKey = useMemo(() => sendFormKeys.draft(walletId).toKey(), [walletId]);

    useEffect(() => {
        queryClient.setQueryDefaults(draftKey, {
            gcTime: QUERIES_GC_TIME.SEND_FORM_DRAFT,
            meta: {
                persist: true,
                schemaKey: 'sendFormDraft'
            }
        });
    }, [queryClient, draftKey]);

    const initialDraft = useMemo(() => queryClient.getQueryData<SendFormDraft>(draftKey), []);

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
