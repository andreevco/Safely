import { useNavigation } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActivePortfolio, usePortfolios } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { PortfoliosList } from '@mobile/features/portfolio';
import { Button, ChevronDown16, Icon, PopupMenu } from '@mobile/shared/ui';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { styles } from './CompactAccountSelector.styles';

export const CompactAccountSelector = () => {
    const popupMenuRef = useRef<PopupMenuRef>(null);
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const { t } = useTranslation();

    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();

    return (
        <PopupMenu
            ref={popupMenuRef}
            touchable={
                <View style={styles.container}>
                    <PortfolioName meta={portfolio.meta} />
                    <Icon icon={ChevronDown16} color="tertiary" />
                </View>
            }
        >
            <View style={styles.listContainer}>
                <PortfoliosList
                    portfolios={portfolios}
                    variant="compact"
                    onSelect={() => {
                        popupMenuRef.current?.close();
                        impactAsync(ImpactFeedbackStyle.Medium);
                    }}
                />
            </View>
            <Button
                style={styles.addButton}
                type="secondary"
                size="medium"
                onPress={() => {
                    popupMenuRef.current?.close();
                    navigation.navigate('AddWalletModal');
                }}
            >
                {t('addWallet.title')}
            </Button>
        </PopupMenu>
    );
};
