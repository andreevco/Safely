import { Contact } from '@safely/core';

import { ContactSuggestion } from '../types';

export function mapContactToSuggestions(contact: Contact): ContactSuggestion[] {
    return contact.addresses.map(address => ({
        id: `${contact.id.toString()}:${address.address}`,
        address: address.address,
        meta: contact.meta
    }));
}
