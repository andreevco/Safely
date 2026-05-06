import type {
    BtcAssetAmount,
    Contact,
    CryptoAsset,
    NumberFormatter,
    RatedCryptoAssetAmount,
    Recipient
} from '@safely/core';

import type {
    AmountInputType,
    AmountWithInputType,
    SendFormErrors,
    SendFormInitialValues,
    SendFormResult,
    SendFormValues,
    SendSuggestionState,
    SendSuggestions
} from '../types';
import type { calculateMaxAmount, validateAmount } from '../validators/amount';
import type { validateRecipientInput } from '../validators/recipient';

export interface CreateContactInput {
    name: string;
    addresses: {
        address: string;
        blockchain: Recipient['blockchain'];
    }[];
}

export type RecipientValidator = (
    value: string,
    preferredSuggestionId?: string
) => ReturnType<typeof validateRecipientInput>;

export type AmountValidator = (
    value: string,
    inputType: SendFormValues['amountInputType'],
    asset: RatedCryptoAssetAmount | undefined
) => ReturnType<typeof validateAmount>;

export type MaxAmountComputer = (
    amount: BtcAssetAmount,
    price: RatedCryptoAssetAmount['price'],
    inputType: SendFormValues['amountInputType']
) => ReturnType<typeof calculateMaxAmount>;

export type AssetByIdLookup = (id: string) => RatedCryptoAssetAmount | undefined;

export type FetchMaxValue = (recipient: Recipient) => Promise<BtcAssetAmount | undefined>;

export interface SendFormMachineInput {
    resolvedInitialValues: SendFormInitialValues | undefined;
    initialSuggestion: SendSuggestionState | undefined;
    formatter: NumberFormatter;

    shouldResetForm: () => boolean;
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    createContact: (input: CreateContactInput) => Promise<Contact>;

    validateRecipient: RecipientValidator;
    validateAmount: AmountValidator;
    computeMaxAmount: MaxAmountComputer;
    findAssetById: AssetByIdLookup;
    getRecipientMeta: (selectedId: string | undefined) => SendFormResult['recipientMeta'];
    fetchMaxValue: FetchMaxValue;
}

export interface SendFormMachineContext {
    values: SendFormValues;
    parsed: {
        recipient: Recipient | undefined;
        amount: AmountWithInputType<CryptoAsset> | undefined;
        asset: RatedCryptoAssetAmount | undefined;
        maxValue: BtcAssetAmount | undefined;
    };
    errors: SendFormErrors;
    suggestion: SendSuggestionState;

    formatter: NumberFormatter;

    shouldResetForm: SendFormMachineInput['shouldResetForm'];
    onSubmit: SendFormMachineInput['onSubmit'];
    createContact: SendFormMachineInput['createContact'];
    validateRecipient: RecipientValidator;
    validateAmount: AmountValidator;
    computeMaxAmount: MaxAmountComputer;
    findAssetById: AssetByIdLookup;
    getRecipientMeta: SendFormMachineInput['getRecipientMeta'];
    fetchMaxValue: FetchMaxValue;
}

export type SendFormEvent =
    | { type: 'SET_RECIPIENT'; value: string }
    | { type: 'SET_ADDRESS_BOOK_NAME'; name: string }
    | { type: 'SELECT_SUGGESTION'; id: string; visible: SendSuggestions }
    | { type: 'CLEAR_SUGGESTION' }
    | { type: 'SET_AMOUNT'; value: string }
    | { type: 'SET_AMOUNT_INPUT_TYPE'; value: AmountInputType }
    | { type: 'SET_ASSET'; assetId: string }
    | { type: 'ENTER_MAX' }
    | { type: 'EXIT_MAX' }
    | { type: 'NEXT' }
    | { type: 'PREV' }
    | { type: 'BACK_TO_EDITING' }
    | { type: 'RESET' };
