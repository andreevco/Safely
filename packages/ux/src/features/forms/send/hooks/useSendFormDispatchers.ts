import { useMemo } from 'react';

import type { SendFormEvent } from '../machine/types';
import type { AmountInputType, SendSuggestions } from '../types';

type Send = (event: SendFormEvent) => void;

export interface SendFormDispatchers {
    setRecipient: (value: string) => void;
    setAddressBookName: (name: string) => void;
    setAmount: (value: string) => void;
    setAmountInputType: (value: AmountInputType) => void;
    setAsset: (assetId: string) => void;
    enterMax: () => void;
    exitMax: () => void;
    selectSuggestion: (id: string, visible: SendSuggestions) => void;
    clearSuggestion: () => void;
    goPrev: () => void;
    goNext: () => void;
    backToEditing: () => void;
}

export function useSendFormDispatchers(send: Send): SendFormDispatchers {
    return useMemo<SendFormDispatchers>(
        () => ({
            setRecipient: value => send({ type: 'SET_RECIPIENT', value }),
            setAddressBookName: name => send({ type: 'SET_ADDRESS_BOOK_NAME', name }),
            setAmount: value => send({ type: 'SET_AMOUNT', value }),
            setAmountInputType: value => send({ type: 'SET_AMOUNT_INPUT_TYPE', value }),
            setAsset: assetId => send({ type: 'SET_ASSET', assetId }),
            enterMax: () => send({ type: 'ENTER_MAX' }),
            exitMax: () => send({ type: 'EXIT_MAX' }),
            selectSuggestion: (id, visible) => send({ type: 'SELECT_SUGGESTION', id, visible }),
            clearSuggestion: () => send({ type: 'CLEAR_SUGGESTION' }),
            goPrev: () => send({ type: 'PREV' }),
            goNext: () => send({ type: 'NEXT' }),
            backToEditing: () => send({ type: 'BACK_TO_EDITING' })
        }),
        [send]
    );
}
