import { useNavigation } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useActivePortfolio, usePortfolios } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { PortfoliosList } from '@mobile/features/portfolio';
import { Button, ChevronDown16, Icon, PopupMenu } from '@mobile/shared/ui';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { styles } from './CompactAccountSelector.styles';

const Touchable = ({
    progress,
    portfolio
}: {
    progress: SharedValue<number>;
    portfolio: Portfolio;
}) => {
    const innerAnimatedOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [1, 0.56])
    }));

    return (
        <View style={styles.touchableContainer}>
            <Animated.View style={[styles.innerTouchableContainer, innerAnimatedOpacity]}>
                <PortfolioName meta={portfolio.meta} />
                <Icon icon={ChevronDown16} color="tertiary" />
            </Animated.View>
        </View>
    );
};

export const CompactAccountSelector = () => {
    const popupMenuRef = useRef<PopupMenuRef>(null);
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const { t } = useTranslation();

    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();

    return (
        <PopupMenu
            ref={popupMenuRef}
            touchable={progress => <Touchable progress={progress} portfolio={portfolio} />}
        >
            <View style={styles.listContainer}>
                <PortfoliosList
                    portfolios={portfolios}
                    variant="compact"
                    onCustomize={() => {
                        popupMenuRef.current?.close();
                    }}
                    onSelect={() => {
                        popupMenuRef.current?.close();
                        impactAsync(ImpactFeedbackStyle.Medium);
                    }}
                />
            </View>
            <Button
                style={styles.addButton}
                type="secondary"
                size="small"
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
