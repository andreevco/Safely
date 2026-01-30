import { Screen, Text } from '@mobile/shared/ui';
import { useTranslation } from 'react-i18next';

export const SelectAccountModal = () => {
    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Button disabled type="small">
                    <Text textAlign="center" variant="labelM">
                        {t('actions.edit')}
                    </Text>
                </Screen.Header.Button>
                <Screen.Header.Title>{t('accounts.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
        </Screen>
    );
};
