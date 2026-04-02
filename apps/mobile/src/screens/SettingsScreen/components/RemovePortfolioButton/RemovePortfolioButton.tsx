import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './RemovePortfolioButton.styles';

export const RemovePortfolioButton = () => {
    const { t } = useTranslation();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const portfolio = useActivePortfolio();

    const handleDeletePortfolio = () => {
        rootNavigation.navigate('RemoveWalletSheet');
    };

    return (
        <Cell style={styles.cell} onPress={handleDeletePortfolio}>
            <Cell.Content>
                <Cell.Row style={styles.row}>
                    <Text variant="labelL" textAlign="center" style={styles.text}>
                        {t('settings.removePortfolio.title', {
                            name:
                                portfolio.meta.icon.type === 'emoji'
                                    ? `${portfolio.meta.icon.value} ${portfolio.meta.name}`
                                    : portfolio.meta.name
                        })}
                    </Text>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
