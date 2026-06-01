import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import { useActivePortfolio } from '@safely/ux';

import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './RemovePortfolioButton.styles';

type RemovePortfolioButtonProps = {
    showDivider?: boolean;
};

export const RemovePortfolioButton = (props: RemovePortfolioButtonProps) => {
    const { showDivider = true } = props;
    const { t } = useTranslation();
    const rootNavigation = useNavigation();
    const portfolio = useActivePortfolio();

    const handleDeletePortfolio = () => {
        rootNavigation.navigate('RemoveWalletSheet');
    };

    return (
        <Cell showDivider={showDivider} background="accentRed" onPress={handleDeletePortfolio}>
            <Cell.Content>
                <Cell.Row style={styles.row}>
                    <Text variant="labelL" textAlign="center" style={styles.text}>
                        {t('settings.removePortfolio.title', {
                            name: portfolio.meta.name
                        })}
                    </Text>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
