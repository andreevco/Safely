import { useTranslation } from 'react-i18next';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { Icon, Text, AddressBook96 } from '@mobile/shared/ui';

import { styles } from './AddressBookHeader.styles';

type AddressBookHeaderProps = ViewProps & {
    description?: string;
};

export const AddressBookHeader = (props: AddressBookHeaderProps) => {
    const { t } = useTranslation();
    const { style, description = t('addressBook.subtitle'), ...rest } = props;

    return (
        <View style={[styles.content, style]} {...rest}>
            <Icon icon={AddressBook96} />
            <View style={styles.textContainer}>
                <Text textAlign="center" variant="titleM">
                    {t('addressBook.title')}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {description}
                </Text>
            </View>
        </View>
    );
};
