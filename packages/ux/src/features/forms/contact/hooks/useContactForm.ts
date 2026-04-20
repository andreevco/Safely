import { useCallback, useMemo } from 'react';

import { Contact } from '@safely/core';

import { useCreateContact, useEditContact } from '../../../../entities';
import { ContactFormResult } from '../types';
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
                ? { name: initialContact.meta.name, address: initialContact.address }
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
        !!state.parsed.address &&
        !!state.parsed.blockchain &&
        !state.errors.name &&
        !state.errors.address;

    const hasChanges = useMemo(() => {
        if (!initialContact) return true;

        const nextName = state.parsed.name ?? state.values.name.trim();
        const nextAddress = state.parsed.address ?? state.values.address.trim();
        const nextBlockchain = state.parsed.blockchain;

        return (
            nextName !== initialContact.meta.name ||
            nextAddress !== initialContact.address ||
            (nextBlockchain !== undefined && nextBlockchain !== initialContact.blockchain)
        );
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
                  address: result.address,
                  blockchain: result.blockchain
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
