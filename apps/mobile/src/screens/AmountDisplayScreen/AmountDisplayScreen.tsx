import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import { Screen } from '@mobile/shared/ui';
import { Icon, Xmark16 } from '@mobile/shared/ui/Icon';

import { styles } from './AmountDisplayScreen.styles';

export const AmountDisplayScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    return (
        <Screen>
            <Screen.Header variant="center">
                <Screen.Header.BackButton />
                <Screen.Header.Title>{t('amountDisplay.title')}</Screen.Header.Title>
                <Screen.Header.Button onPress={() => navigation.getParent()?.goBack()}>
                    <Icon icon={Xmark16} />
                </Screen.Header.Button>
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.listContent} />
        </Screen>
    );
};
