import { type FlashListProps, FlashList } from '@shopify/flash-list';

import { Contact } from '@safely/core';

import { ContactCell } from '@mobile/entities/contact';

import { styles } from './AddressBook.styles';

type AddressBookProps = {
    contacts: Contact[];
    onContactPress: (contact: Contact) => void;
    ListHeaderComponent: FlashListProps<Contact>['ListHeaderComponent'];
};

export const AddressBook = ({
    contacts,
    onContactPress,
    ListHeaderComponent
}: AddressBookProps) => {
    return (
        <FlashList
            showsVerticalScrollIndicator={false}
            data={contacts}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={styles.contentContainer}
            renderItem={({ item, index }) => (
                <ContactCell
                    containerStyle={styles.cell({
                        isLast: index === contacts.length - 1,
                        isFirst: index === 0
                    })}
                    showDivider={index !== contacts.length - 1}
                    meta={item.meta}
                    onPress={() => onContactPress(item)}
                />
            )}
        />
    );
};
