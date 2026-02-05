import { PortfoliosList } from '@mobile/features/portfolio';
import { Screen, Text } from '@mobile/shared/ui';
import { useTranslation } from 'react-i18next';

import { usePortfolios } from '@safely/ux';

export const SelectAccountModal = () => {
    const { t } = useTranslation();
    const portfolios = usePortfolios();

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
            <Screen.Scrollable>
                <PortfoliosList portfolios={portfolios} />
            </Screen.Scrollable>
        </Screen>
    );
};
