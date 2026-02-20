import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useActivePortfolio, useDeletePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './RemovePortfolioButton.styles';

export const RemovePortfolioButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const portfolio = useActivePortfolio();

    const { mutateAsync: deletePortfolio } = useDeletePortfolio();
    const { mutate: removePortfolio } = useMutation({
        async mutationFn() {
            await deletePortfolio(portfolio);

            rootNavigation.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            });
        }
    });

    const handleDeletePortfolio = () => {
        Alert.alert(
            t('settings.removePortfolio.confirm.title', { name: portfolio.meta.name }),
            t('settings.removePortfolio.confirm.message', { name: portfolio.meta.name }),
            [
                { text: t('settings.removePortfolio.confirm.cancel'), style: 'cancel' },
                {
                    text: t('settings.removePortfolio.confirm.confirm'),
                    style: 'destructive',
                    onPress: () => removePortfolio()
                }
            ]
        );
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
