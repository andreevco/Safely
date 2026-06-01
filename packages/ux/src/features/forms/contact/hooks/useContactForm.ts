import { useCallback, useMemo } from 'react';

import type { Contact } from '@safely/core';
import { vmTypeByBlockchainName } from '@safely/core';

import { useCreateContact, useEditContact } from '../../../../entities';
import type { ContactFormResult } from '../types';
import { useContactFormState } from './useContactFormState';

export interface UseContactFormParams {
    initialContact?: Contact;
    onSuccess?: (contact: Contact) => void;
}

export function useContactForm(params: UseContactFormParams) {
    const { initialContact, onSuccess } = params;

    const initialValues = useMemo(
        () =>
            initialContact
                ? {
                      name: initialContact.meta.name,
                      addresses: initialContact.addresses.map(a => a.address)
                  }
                : undefined,
        [initialContact]
    );

    const { state, actions, buildResult } = useContactFormState({ initialValues });

    const { mutateAsync: createContact, isPending: isCreating } = useCreateContact();
    const { mutateAsync: editContact, isPending: isEditing } = useEditContact();

    const isEditMode = !!initialContact;
    const isSubmitting = isCreating || isEditing;

    const isValid =
        !!state.parsed.name &&
        !state.errors.name &&
        state.parsed.addresses.length > 0 &&
        state.parsed.addresses.every(parsed => !!parsed) &&
        state.errors.addresses.every(error => !error);

    const hasChanges = useMemo(() => {
        if (!initialContact) return true;

        const nextName = state.parsed.name ?? state.values.name.trim();
        if (nextName !== initialContact.meta.name) return true;

        const nextAddresses = state.parsed.addresses;
        if (nextAddresses.length !== initialContact.addresses.length) return true;

        return nextAddresses.some((parsed, index) => {
            const initial = initialContact.addresses[index];
            return (
                !parsed ||
                !initial ||
                parsed.address !== initial.address ||
                vmTypeByBlockchainName(parsed.blockchain) !== initial.blockchain
            );
        });
    }, [initialContact, state.parsed, state.values]);

    const canSubmit = isValid && hasChanges && !isSubmitting;

    const submit = useCallback(async (): Promise<Contact | null> => {
        if (!canSubmit) return null;

        const result: ContactFormResult | null = buildResult();
        if (!result) return null;

        const contact = initialContact
            ? await editContact({
                  contact: initialContact,
                  meta: { name: result.name },
                  addresses: result.addresses
              })
            : await createContact(result);

        onSuccess?.(contact);

        return contact;
    }, [buildResult, canSubmit, createContact, editContact, initialContact, onSuccess]);

    return {
        state,
        actions: {
            setName: actions.setName,
            setAddress: actions.setAddress,
            addAddress: actions.addAddress,
            removeAddress: actions.removeAddress,
            reset: actions.reset,
            submit
        },
        meta: {
            isEditMode,
            isSubmitting,
            canSubmit
        }
    };
}
