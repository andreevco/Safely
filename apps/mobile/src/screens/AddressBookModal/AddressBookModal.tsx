import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useContacts } from '@safely/ux';

import { AddressBookHeader } from '@mobile/features/addressbook';
import { AddressBook } from '@mobile/features/addressbook/AddressBook';
import { Screen, Button } from '@mobile/shared/ui';

import { styles } from './AddressBookModal.styles';

export const AddressBookModal = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const contacts = useContacts();

    if (contacts.length === 0) {
        return (
            <Screen>
                <Screen.Header>
                    <Screen.Header.BackButton />
                </Screen.Header>
                <Screen.Content bottomInset={false}>
                    <AddressBookHeader style={styles.headerFullScreen} />
                    <View style={styles.buttonContainer}>
                        <Button
                            type="primary"
                            size="large"
                            onPress={() => navigation.navigate('NewContactModal')}
                        >
                            {t('addressBook.addContact')}
                        </Button>
                    </View>
                </Screen.Content>
            </Screen>
        );
    }

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.BackButton />
                <Screen.Header.Title />
            </Screen.Header>
            <Screen.Content bottomInset={false}>
                <View style={styles.listWrapper}>
                    <AddressBook
                        contacts={contacts}
                        onContactPress={contact =>
                            navigation.navigate('NewContactModal', {
                                contactId: contact.id.toString()
                            })
                        }
                        ListHeaderComponent={
                            <View style={styles.listHeader}>
                                <AddressBookHeader
                                    description={t('addressBook.subtitle_not_empty')}
                                />
                            </View>
                        }
                    />
                </View>
                <View style={styles.footer}>
                    <Button
                        type="secondary"
                        size="large"
                        onPress={() => navigation.navigate('NewContactModal')}
                    >
                        {t('addressBook.addContact')}
                    </Button>
                </View>
            </Screen.Content>
        </Screen>
    );
};
