import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Text } from '@mobile/shared/ui';

import { styles } from './RemovePortfolioButton.styles';

export const RemovePortfolioButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const portfolio = useActivePortfolio();

    const handleDeletePortfolio = () => {
        rootNavigation.navigate('RemoveWalletSheet');
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
