import type { FC } from 'react';

import type { Contact } from '@safely/core';
import { useContacts, useTranslate } from '@safely/ux';
import AddressBook96 from '@safely/ux/assets/icons/96/address-book-96.svg?react';

import {
    actionStyles,
    descriptionStyles,
    emptyStyles,
    introStyles,
    titleStyles
} from './AddressBookSettings.styles';
import { listStyles } from './SettingsSection.styles';
import { ContactCell } from '../../../entities';
import { Button, Icon, List, PageHeader, Text } from '../../../shared';

export type AddressBookSettingsProps = {
    onAddContact: () => void;
    onOpenContact: (contact: Contact) => void;
};

export const AddressBookSettings: FC<AddressBookSettingsProps> = props => {
    const { onAddContact, onOpenContact } = props;

    const t = useTranslate();
    const contacts = useContacts();

    const intro = (
        <div className={introStyles}>
            <Icon asset={AddressBook96} size={96} />
            <Text as="h2" className={titleStyles}>
                {t('addressBook.title')}
            </Text>
            <Text variant="bodyL" tone="secondary" align="center" className={descriptionStyles}>
                {contacts.length === 0
                    ? t('addressBook.subtitle')
                    : t('addressBook.subtitle_not_empty')}
            </Text>
            <Button
                variant={contacts.length === 0 ? 'primary' : 'secondary'}
                size="small"
                className={actionStyles}
                onClick={onAddContact}
            >
                {t('addressBook.addContact')}
            </Button>
        </div>
    );

    if (contacts.length === 0) {
        return (
            <>
                <PageHeader title={t('addressBook.title')} hasDivider />
                <div className={emptyStyles}>{intro}</div>
            </>
        );
    }

    return (
        <>
            <PageHeader title={t('addressBook.title')} hasDivider />

            {intro}

            <List className={listStyles}>
                <List.Group variant="divided">
                    {contacts.map(contact => (
                        <ContactCell
                            key={contact.id.toString()}
                            contact={contact}
                            onSelect={() => onOpenContact(contact)}
                        />
                    ))}
                </List.Group>
            </List>
        </>
    );
};
