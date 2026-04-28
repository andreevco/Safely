import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useContacts } from '@safely/ux';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { AddressBookHeader } from '@mobile/features/addressbook';
import { AddressBook } from '@mobile/features/addressbook/AddressBook';
import { Screen, Button } from '@mobile/shared/ui';

import { styles } from './AddressBookModal.styles';

export const AddressBookModal = () => {
    const navigation = useNavigation<SettingsStackNavigationProp<'AddressBookModal'>>();
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
                <Button
                    hitSlop={12}
                    type="primary"
                    size="small"
                    style={styles.button}
                    onPress={() => navigation.navigate('NewContactModal')}
                >
                    {t('addressBook.addContact')}
                </Button>
            </Screen.Header>
            <Screen.Content bottomInset={false}>
                <AddressBook
                    contacts={contacts}
                    onContactPress={contact =>
                        navigation.navigate('NewContactModal', { contactId: contact.id.toString() })
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <AddressBookHeader description={t('addressBook.subtitle_not_empty')} />
                        </View>
                    }
                />
            </Screen.Content>
        </Screen>
    );
};
