import { useNavigation } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { useActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { ChevronDown16, Icon, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './AccountSelector.styles';

export const AccountSelector = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const portfolio = useActivePortfolio();

    return (
        <TouchableOpacity
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
