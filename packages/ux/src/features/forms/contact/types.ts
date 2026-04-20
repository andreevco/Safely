import { BLOCKCHAIN_NAME } from '@safely/core';

export interface ContactFormValues {
    name: string;
    address: string;
}

export interface ContactFormParsed {
    name: string | undefined;
    address: string | undefined;
    blockchain: BLOCKCHAIN_NAME | undefined;
}

export interface ContactFormErrors {
    name: string | undefined;
    address: string | undefined;
}

export interface ContactFormState {
    values: ContactFormValues;
    parsed: ContactFormParsed;
    errors: ContactFormErrors;
}

export interface ContactFormInitialValues {
    name?: string;
    address?: string;
}

export type ContactFormAction =
    | { type: 'SET_NAME'; value: string }
    | { type: 'SET_NAME_VALIDATED'; parsed: string | undefined; error: string | undefined }
    | { type: 'SET_ADDRESS'; value: string }
    | {
          type: 'SET_ADDRESS_VALIDATED';
          parsed: string | undefined;
          blockchain: BLOCKCHAIN_NAME | undefined;
          error: string | undefined;
      }
    | { type: 'RESET' };

export interface ContactFormResult {
    name: string;
    address: string;
    blockchain: BLOCKCHAIN_NAME;
}
