import type { RatedCryptoAssetAmount } from '@safely/core';

import {
    useActiveBtcWallet,
    useActivePortfolio,
    useCreateContact,
    useNumberFormatter
} from '../../../../entities';
import { useFetchMaxValue } from '../../../blockchain-send';
import type { SendFormMachineInput } from '../machine/types';
import type {
    ContactSuggestion,
    PortfolioSuggestion,
    SendFormInitialValues,
    SendFormResult,
    SendSuggestionState
} from '../types';

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
    const activePortfolio = useActivePortfolio();
    const { mutateAsync: createContact } = useCreateContact();

    return {
        resolvedInitialValues: initialValues,
        initialSuggestion: computeInitialSuggestion(
            initialValues,
            portfolioSuggestions,
            contactSuggestions
        ),
        formatter,
        portfolioSuggestions,
        contactSuggestions,
        ratedAssets,
        activeWallet: {
            id: activePortfolio.id.toString(),
            address: activeBtcWallet.address,
            meta: activePortfolio.meta
        },
        shouldResetForm: () => shouldResetForm,
        onSubmit,
        createContact,
        fetchMaxValue
    };
}
