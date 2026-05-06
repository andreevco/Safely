import { useRef, useState } from 'react';

import type { RatedCryptoAssetAmount } from '@safely/core';

import { useActiveBtcWallet, useCreateContact, useNumberFormatter } from '../../../../entities';
import { useFetchMaxValue } from '../../../blockchain-send';
import type { SendFormMachineInput } from '../machine/types';
import type {
    ContactSuggestion,
    PortfolioSuggestion,
    SendFormInitialValues,
    SendFormResult,
    SendSuggestionState
} from '../types';
import { computeRecipientMeta } from '../utils';
import { calculateMaxAmount, validateAmount } from '../validators/amount';
import { validateRecipientInput } from '../validators/recipient';

export interface UseSendFormMachineInputProps {
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    shouldResetForm: boolean;
    initialValues: SendFormInitialValues | undefined;
    portfolioSuggestions: PortfolioSuggestion[];
    contactSuggestions: ContactSuggestion[];
    ratedAssets: RatedCryptoAssetAmount[];
}

function computeInitialSuggestion(
    initialValues: SendFormInitialValues | undefined,
    portfolioSuggestions: PortfolioSuggestion[],
    contactSuggestions: ContactSuggestion[]
): SendSuggestionState | undefined {
    const address = initialValues?.recipient;
    if (!address) return undefined;

    const match =
        portfolioSuggestions.find(s => s.address === address) ??
        contactSuggestions.find(s => s.address === address);
    if (!match) return undefined;

    return {
        selectedId: match.id,
        portfoliosIds: portfolioSuggestions.map(s => s.id),
        contactsIds: contactSuggestions.map(s => s.id)
    };
}

export function useSendFormMachineInput(props: UseSendFormMachineInputProps): SendFormMachineInput {
    const {
        onSubmit,
        shouldResetForm,
        initialValues,
        portfolioSuggestions,
        contactSuggestions,
        ratedAssets
    } = props;

    const formatter = useNumberFormatter();
    const fetchMaxValue = useFetchMaxValue();
    const activeBtcWallet = useActiveBtcWallet();
    const { mutateAsync: createContact } = useCreateContact();

    const portfolioSuggestionsRef = useRef(portfolioSuggestions);
    portfolioSuggestionsRef.current = portfolioSuggestions;
    const contactSuggestionsRef = useRef(contactSuggestions);
    contactSuggestionsRef.current = contactSuggestions;

    const [initialSuggestion] = useState(() =>
        computeInitialSuggestion(initialValues, portfolioSuggestions, contactSuggestions)
    );

    return {
        resolvedInitialValues: initialValues,
        initialSuggestion,
        formatter,
        shouldResetForm: () => shouldResetForm,
        onSubmit,
        createContact,
        validateRecipient: (value, preferredSuggestionId) =>
            validateRecipientInput(value, {
                activeWalletAddress: activeBtcWallet.address,
                portfolioSuggestions: portfolioSuggestionsRef.current,
                contactSuggestions: contactSuggestionsRef.current,
                preferredSuggestionId
            }),
        validateAmount: (value, inputType, asset) =>
            validateAmount(value, inputType, asset, formatter),
        computeMaxAmount: (amount, price, inputType) =>
            calculateMaxAmount({ amount, price }, inputType, formatter),
        findAssetById: id => ratedAssets.find(({ amount }) => amount.asset.id.toString() === id),
        getRecipientMeta: selectedId =>
            computeRecipientMeta(
                selectedId,
                portfolioSuggestionsRef.current,
                contactSuggestionsRef.current
            ),
        fetchMaxValue
    };
}
