import { useNavigation } from '@react-navigation/core';
import { useTranslation } from 'react-i18next';

import { PortfolioType } from '@safely/core';
import {
    useActivePortfolioEntities,
    useActiveWalletMeta,
    useIsActivePortfolioOverview
} from '@safely/ux';

import { Cell, Text } from '@mobile/shared/ui';

import { styles } from './RemovePortfolioButton.styles';

type RemovePortfolioButtonProps = {
    showDivider?: boolean;
};

export const RemovePortfolioButton = (props: RemovePortfolioButtonProps) => {
    const { showDivider = true } = props;
    const { t } = useTranslation();
    const rootNavigation = useNavigation();
    const activeMeta = useActiveWalletMeta();
    const entities = useActivePortfolioEntities();
    const isLedgerDevice = useIsActivePortfolioOverview();

    const isLedgerDerivation = entities.portfolio.type === PortfolioType.LEDGER && !isLedgerDevice;

    const handleDeletePortfolio = () => {
        rootNavigation.navigate('RemoveWalletSheet');
    };

    const label = t(
        isLedgerDerivation
            ? 'settings.removePortfolio.hideDerivation'
            : isLedgerDevice
              ? 'settings.removePortfolio.disconnectLedger'
              : 'settings.removePortfolio.title',
        { name: activeMeta.name }
    );

    return (
        <Cell showDivider={showDivider} background="accentRed" onPress={handleDeletePortfolio}>
            <Cell.Content>
                <Cell.Row style={styles.row}>
                    <Text variant="labelL" textAlign="center" style={styles.text}>
                        {label}
                    </Text>
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};
