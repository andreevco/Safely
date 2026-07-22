import type { RatedCryptoAssetAmount } from '@safely/core';

import {
    useActiveBtcWallet,
    useActivePortfolio,
    useActiveWalletMeta,
    useCreateContact,
    useNumberFormatter
} from '../../../../entities';
import { useFetchMaxValue } from '../../../blockchain-send';
import { useAmountInputType, useSetAmountInputType } from '../amountInputType';
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
    const activeWalletMeta = useActiveWalletMeta();
    const { mutateAsync: createContact } = useCreateContact();

    const rememberedInputType = useAmountInputType();
    const persistAmountInputType = useSetAmountInputType();

    const normalizedInitialAmount =
        initialValues?.amount === undefined
            ? undefined
            : formatter.normalizeCanonicalInput(initialValues.amount);
    const initialAmount =
        normalizedInitialAmount?.status === 'ok' ? normalizedInitialAmount.value : undefined;

    return {
        resolvedInitialValues: initialValues && { ...initialValues, amount: initialAmount },
        formatter,
        portfolioSuggestions,
        contactSuggestions,
        ratedAssets,
        activeWallet: {
            id: activePortfolio.id.toString(),
            address: activeBtcWallet.address,
            meta: activeWalletMeta
        },
        networkType: activePortfolio.networkType,
        shouldResetForm: () => shouldResetForm,
        onSubmit,
        createContact,
        fetchMaxValue,
        persistAmountInputType,
        initialAmountInputType: initialAmount === undefined ? rememberedInputType : 'crypto'
    };
}
