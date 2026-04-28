import { BLOCKCHAIN_NAME } from '@safely/core';

export interface ContactFormParsedAddress {
    address: string;
    blockchain: BLOCKCHAIN_NAME;
}

export interface ContactFormAddressValue {
    value: string;
}

export interface ContactFormValues {
    name: string;
    addresses: ContactFormAddressValue[];
}

export interface ContactFormParsed {
    name: string | undefined;
    addresses: (ContactFormParsedAddress | undefined)[];
}

export interface ContactFormErrors {
    name: string | undefined;
    addresses: (string | undefined)[];
}

export interface ContactFormState {
    values: ContactFormValues;
    parsed: ContactFormParsed;
    errors: ContactFormErrors;
}

export interface ContactFormInitialValues {
    name?: string;
    addresses?: string[];
}

export type ContactFormAction =
    | { type: 'SET_NAME'; value: string }
    | { type: 'SET_NAME_VALIDATED'; parsed: string | undefined; error: string | undefined }
    | { type: 'SET_ADDRESS'; index: number; value: string }
    | {
          type: 'SET_ADDRESS_VALIDATED';
          index: number;
          parsed: ContactFormParsedAddress | undefined;
          error: string | undefined;
      }
    | { type: 'ADD_ADDRESS' }
    | { type: 'REMOVE_ADDRESS'; index: number }
    | { type: 'RESET' };

export interface ContactFormResult {
    name: string;
    addresses: ContactFormParsedAddress[];
}
