import {
    BLOCKCHAIN_NAME,
    BtcAsset,
    CryptoAsset,
    CryptoAssetAmount,
    FiatAssetAmount,
    PortfolioMeta,
    RatedCryptoAssetAmount,
    Recipient
} from '@safely/core';

export interface SendSuggestion {
    address: string;
    meta: PortfolioMeta;
    tag?: number;
}

export type AmountInputType = 'crypto' | 'fiat';

export type AmountCryptoFirst<C extends CryptoAsset> = {
    inputType: 'crypto';
    cryptoAssetAmount: CryptoAssetAmount<C>;
    fiatAssetAmount?: FiatAssetAmount;
};

export type AmountFiatFirst<C extends CryptoAsset> = {
    inputType: 'fiat';
    cryptoAssetAmount: CryptoAssetAmount<C>;
    fiatAssetAmount: FiatAssetAmount;
};

export type AmountWithInputType<C extends CryptoAsset> = AmountCryptoFirst<C> | AmountFiatFirst<C>;

export interface AmountValidationResult {
    formatted: string;
    parsed: AmountWithInputType<CryptoAsset> | undefined;
    error: string | undefined;
}

export interface AmountWithOutputType<C extends CryptoAsset = CryptoAsset> {
    formatted: string;
    parsed: AmountWithInputType<C>;
}

export type SendFormResultBtc = {
    blockchain: BLOCKCHAIN_NAME.BTC;
    recipient: Recipient;
    amount: AmountWithInputType<BtcAsset>;
    isMax: boolean;
};

export type SendFormResult = SendFormResultBtc;

export enum FormStepNames {
    RECIPIENT = 'recipient',
    ASSET_AMOUNT = 'assetAmount'
}

export const SEND_STEPS = [FormStepNames.RECIPIENT, FormStepNames.ASSET_AMOUNT] as const;
export type SendStepId = (typeof SEND_STEPS)[number];

export interface SendFormInitialValues {
    recipient?: string;
    amount?: string;
    amountInputType?: AmountInputType;
    stepIndex?: number;
}

export interface SendFormValues {
    recipient: string;
    recipientLabel: string | undefined;
    amount: string;
    amountInputType: AmountInputType;
    isMax: boolean;
    assetId: string;
}

export interface SendFormParsed {
    recipient: Recipient | undefined;
    amount: AmountWithInputType<CryptoAsset> | undefined;
    asset: RatedCryptoAssetAmount | undefined;
    isMax: boolean;
}

export interface SendFormErrors {
    recipient: string | undefined;
    amount: string | undefined;
    asset: string | undefined;
}

export interface SendFormState {
    values: SendFormValues;
    parsed: SendFormParsed;
    errors: SendFormErrors;
    stepIndex: number;
}

export type SendFormAction =
    | { type: 'SET_RECIPIENT'; value: string; label?: string }
    | {
          type: 'SET_RECIPIENT_VALIDATED';
          recipient: Recipient | undefined;
          error: string | undefined;
      }
    | { type: 'SET_AMOUNT'; value: string }
    | {
          type: 'SET_AMOUNT_VALIDATED';
          parsed: AmountWithInputType<CryptoAsset> | undefined;
          formatted: string;
          error: string | undefined;
      }
    | { type: 'SET_AMOUNT_INPUT_TYPE'; value: AmountInputType }
    | { type: 'SET_IS_MAX'; value: boolean }
    | {
          type: 'SET_ASSET';
          assetId: string;
          asset: RatedCryptoAssetAmount | undefined;
          error: string | undefined;
      }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'RESET' }
    | { type: 'RESET_DEPENDENT_FIELDS' };
