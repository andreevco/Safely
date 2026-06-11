import { useNavigation } from '@react-navigation/core';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { useActivePortfolio } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { TEST_ID } from '@mobile/shared/constants';
import { ChevronDown16, Icon, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './AccountSelector.styles';

export const AccountSelector = () => {
    const navigation = useNavigation();
    const portfolio = useActivePortfolio();

    return (
        <TouchableOpacity
            testID={TEST_ID.home.walletSelector}
            onPress={() => {
                navigation.navigate('SelectAccountModal');
                void impactAsync(ImpactFeedbackStyle.Medium);
            }}
            style={styles.container}
        >
            <PortfolioName meta={portfolio.meta} />
            <Icon icon={ChevronDown16} color="tertiary" />
        </TouchableOpacity>
    );
};
