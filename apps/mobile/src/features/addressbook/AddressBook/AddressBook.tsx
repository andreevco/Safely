import { type FlashListProps, FlashList } from '@shopify/flash-list';
import { useRef } from 'react';

import type { Contact } from '@safely/core';

import { ContactCell } from '@mobile/entities/contact';

import { styles } from './AddressBook.styles';

type AddressBookProps = {
    contacts: Contact[];
    onContactPress: (contact: Contact) => void;
    onScrollableChange: (isScrollable: boolean) => void;
    ListHeaderComponent: FlashListProps<Contact>['ListHeaderComponent'];
};

export const AddressBook = (props: AddressBookProps) => {
    const { contacts, onContactPress, ListHeaderComponent, onScrollableChange } = props;

    const contentHeight = useRef(0);
    const viewportHeight = useRef(0);

    const recompute = () => {
        onScrollableChange(contentHeight.current > viewportHeight.current);
    };

    return (
        <FlashList
            showsVerticalScrollIndicator={false}
            data={contacts}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={styles.contentContainer}
            onLayout={event => {
                viewportHeight.current = event.nativeEvent.layout.height;
                recompute();
            }}
            onContentSizeChange={(_, height) => {
                contentHeight.current = height;
                recompute();
            }}
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
