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
    SendFormResult
} from '../types';

export interface UseSendFormMachineInputProps {
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    shouldResetForm: boolean;
    initialValues: SendFormInitialValues | undefined;
    portfolioSuggestions: PortfolioSuggestion[];
    contactSuggestions: ContactSuggestion[];
    ratedAssets: RatedCryptoAssetAmount[];
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
