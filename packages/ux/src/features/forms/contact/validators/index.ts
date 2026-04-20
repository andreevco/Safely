import { BLOCKCHAIN_NAME } from '@safely/core';

import { ContactFormError } from '../errors';
import { addressSchema, nameSchema, parseContactAddress } from '../utils';

export interface ContactNameValidationResult {
    parsed: string | undefined;
    error: string | undefined;
}

export function validateContactName(value: string): ContactNameValidationResult {
    const zodResult = nameSchema.safeParse(value);

    if (!zodResult.success) {
        return {
            parsed: undefined,
            error: zodResult.error.issues[0]?.message ?? ContactFormError.ENTER_NAME
        };
    }

    return { parsed: zodResult.data, error: undefined };
}

export interface ContactAddressValidationResult {
    parsed: string | undefined;
    blockchain: BLOCKCHAIN_NAME | undefined;
    error: string | undefined;
}

export function validateContactAddress(value: string): ContactAddressValidationResult {
    const zodResult = addressSchema.safeParse(value);

    if (!zodResult.success) {
        return {
            parsed: undefined,
            blockchain: undefined,
            error: zodResult.error.issues[0]?.message ?? ContactFormError.ENTER_ADDRESS
        };
    }

    const parsed = parseContactAddress(zodResult.data);

    if (typeof parsed === 'string') {
        return { parsed: undefined, blockchain: undefined, error: parsed };
    }

    return { parsed: parsed.address, blockchain: parsed.blockchain, error: undefined };
}
