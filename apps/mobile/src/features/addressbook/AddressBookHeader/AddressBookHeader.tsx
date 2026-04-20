import { useTranslation } from 'react-i18next';
import { View, ViewProps } from 'react-native';

import { Icon, Text, AddressBook96 } from '@mobile/shared/ui';

import { styles } from './AddressBookHeader.styles';

export const AddressBookHeader = (props: ViewProps) => {
    const { style, ...rest } = props;
    const { t } = useTranslation();

    return (
        <View style={[styles.content, style]} {...rest}>
            <Icon icon={AddressBook96} />
            <View style={styles.textContainer}>
                <Text textAlign="center" variant="titleM">
                    {t('addressBook.title')}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t('addressBook.subtitle')}
                </Text>
            </View>
        </View>
    );
};
