import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Contact } from '@safely/core';
import { useDeleteContact } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { BottomSheet, Button, Text } from '@mobile/shared/ui';
import { BottomSheetContextType } from '@mobile/shared/ui/BottomSheet/context';

import { styles } from './ConfirmDeleteContactSheet.styles';

type ConfirmDeleteContactSheetProps = StaticScreenProps<{
    contact: Contact;
}>;

export const ConfirmDeleteContactSheet = ({ route }: ConfirmDeleteContactSheetProps) => {
    const { contact } = route.params;
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp<'NewContactModal'>>();
    const bottomSheetRef = useRef<BottomSheetContextType>(null);
    const { mutateAsync: deleteContact } = useDeleteContact();

    const handleDelete = async () => {
        await deleteContact(contact);

        navigation.popTo('SettingsModal');
    };

    return (
        <BottomSheet ref={bottomSheetRef}>
            <View style={styles.content}>
                <Text textAlign="center" variant="titleM">
                    {t('newContact.confirmDelete.title', { name: contact.meta.name })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t('newContact.confirmDelete.message')}
                </Text>
            </View>
            <View style={styles.footer}>
                <Button type="destructive" size="large" onPress={handleDelete}>
                    {t('common.remove')}
                </Button>
                <Button
                    type="secondary"
                    size="large"
                    onPress={() => bottomSheetRef.current?.close()}
                >
                    {t('common.cancel')}
                </Button>
            </View>
        </BottomSheet>
    );
};
