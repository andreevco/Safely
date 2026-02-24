import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useActivePortfolio, useDeletePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './RemovePortfolioButton.styles';

export const RemovePortfolioButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const portfolio = useActivePortfolio();
    const { mutateAsync: deletePortfolio } = useDeletePortfolio();

    const handleDeletePortfolio = () => {
        rootNavigation.navigate('DestructiveConfirmSheet', {
            title: t('settings.removePortfolio.confirm.title'),
            message: t('settings.removePortfolio.confirm.message'),
            sliderLabel: t('settings.removePortfolio.confirm.slider.label'),
            sliderDescription: t('settings.removePortfolio.confirm.slider.description'),
            cancelLabel: t('settings.removePortfolio.confirm.cancel'),
            onConfirm: async () => {
                await deletePortfolio(portfolio);
                rootNavigation.reset({
                    index: 0,
                    routes: [{ name: 'TabsNavigator' }]
                });
            }
        });
    };

    return (
        <List.Group variant="divided">
            <Cell style={styles.cell} onPress={handleDeletePortfolio}>
                <Cell.Content>
                    <Cell.Row>
                        <Text variant="labelL" style={styles.text}>
                            {t('settings.removePortfolio.title', {
                                name: portfolio.meta.name
                            })}
                        </Text>
                    </Cell.Row>
                </Cell.Content>
            </Cell>
        </List.Group>
    );
};
