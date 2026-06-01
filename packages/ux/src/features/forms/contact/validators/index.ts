import { parseAddress, UnsupportedBlockchainError } from '../../../../shared/address';
import { ContactFormError } from '../errors';
import type { ContactFormParsedAddress } from '../types';

export interface ContactNameValidationResult {
    parsed: string | undefined;
    error: string | undefined;
}

export function validateContactName(value: string): ContactNameValidationResult {
    const trimmed = value.trim();

    return { parsed: trimmed.length > 0 ? trimmed : undefined, error: undefined };
}

export interface ContactAddressValidationResult {
    parsed: ContactFormParsedAddress | undefined;
    error: string | undefined;
}

export function validateContactAddress(value: string): ContactAddressValidationResult {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return { parsed: undefined, error: undefined };
    }

    try {
        const parsed = parseAddress(trimmed);
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
