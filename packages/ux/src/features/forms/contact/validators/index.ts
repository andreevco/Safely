import { parseAddress, UnsupportedBlockchainError } from '../../../../shared/address';
import { ContactFormError } from '../errors';
import type { ContactFormParsedAddress } from '../types';
import { addressSchema, nameSchema } from '../utils';

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
    parsed: ContactFormParsedAddress | undefined;
    error: string | undefined;
}

export function validateContactAddress(value: string): ContactAddressValidationResult {
    const zodResult = addressSchema.safeParse(value);

    if (!zodResult.success) {
        return {
            parsed: undefined,
            error: zodResult.error.issues[0]?.message ?? ContactFormError.ENTER_ADDRESS
        };
    }

    try {
        const parsed = parseAddress(zodResult.data);
        return {
            parsed: { address: parsed.address, blockchain: parsed.blockchain },
            error: undefined
        };
    } catch (error) {
        if (error instanceof UnsupportedBlockchainError) {
            return {
                parsed: undefined,
                error: ContactFormError.UNSUPPORTED_BLOCKCHAIN
            };
        }
        return {
            parsed: undefined,
            error: ContactFormError.INVALID_ADDRESS_FORMAT
        };
    }
}
