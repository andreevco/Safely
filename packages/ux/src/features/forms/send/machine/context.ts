import { SendFormErrors, SendFormValues, SendSuggestionState } from '../types';
import type { SendFormMachineContext, SendFormMachineInput } from './types';

export const EMPTY_SUGGESTION: SendSuggestionState = {
    selectedId: undefined,
    portfoliosIds: undefined,
    contactsIds: undefined
};

export const DEFAULT_VALUES: SendFormValues = {
    recipient: '',
    addressBookName: '',
    amount: '',
    amountInputType: 'crypto',
    isMax: false,
    assetId: ''
};

export const DEFAULT_PARSED = {
    recipient: undefined,
    amount: undefined,
    asset: undefined,
    maxValue: undefined
};

export const DEFAULT_ERRORS: SendFormErrors = {
    recipient: undefined,
    amount: undefined,
    asset: undefined
};

export function withResetDependentValues(values: SendFormValues): SendFormValues {
    return {
        ...values,
        amount: '',
        assetId: '',
        isMax: false
    };
}

export function withResetDependentParsed(parsed: SendFormMachineContext['parsed']) {
    return {
        ...parsed,
        amount: undefined,
        asset: undefined,
        maxValue: undefined
    };
}

export function withResetDependentErrors(errors: SendFormErrors): SendFormErrors {
    return {
        ...errors,
        amount: undefined,
        asset: undefined
    };
}

export function suggestionFromValidatorResult(
    result: ReturnType<SendFormMachineInput['validateRecipient']>
): SendSuggestionState | undefined {
    if (!result.suggestion) return undefined;

    const { id: selectedId, portfoliosIds, contactsIds } = result.suggestion;

    return {
        selectedId,
        contactsIds,
        portfoliosIds
    };
}

type ResetDeps = Omit<SendFormMachineContext, 'values' | 'parsed' | 'errors' | 'suggestion'>;

export function buildEmptyContext(deps: ResetDeps): SendFormMachineContext {
    return {
        ...deps,
        values: DEFAULT_VALUES,
        parsed: DEFAULT_PARSED,
        errors: DEFAULT_ERRORS,
        suggestion: EMPTY_SUGGESTION
    };
}

export function buildInitialContext(input: SendFormMachineInput): SendFormMachineContext {
    const baseContext = buildEmptyContext(input);

    const initialValues = input.resolvedInitialValues;
    const initialSuggestion = input.initialSuggestion;

    if (!initialValues?.recipient) {
        return baseContext;
    }

    const result = input.validateRecipient(initialValues.recipient, initialSuggestion?.selectedId);

    const allDraftIds = [
        ...(initialSuggestion?.portfoliosIds ?? []),
        ...(initialSuggestion?.contactsIds ?? [])
    ];
    const draftSuggestionValid =
        !!initialSuggestion?.selectedId && allDraftIds.includes(initialSuggestion.selectedId);

    const validatorSuggestion = suggestionFromValidatorResult(result);

    return {
        ...baseContext,
        values: {
            ...DEFAULT_VALUES,
            recipient: initialValues.recipient,
            addressBookName: initialValues.addressBookName ?? '',
            amount: initialValues.amount ?? '',
            amountInputType: initialValues.amountInputType ?? 'crypto'
        },
        parsed: {
            recipient: result.recipient,
            asset: undefined,
            amount: undefined,
            maxValue: undefined
        },
        errors: {
            recipient: result.error,
            amount: undefined,
            asset: undefined
        },
        suggestion:
            validatorSuggestion ?? (draftSuggestionValid ? initialSuggestion : EMPTY_SUGGESTION)
    };
}
