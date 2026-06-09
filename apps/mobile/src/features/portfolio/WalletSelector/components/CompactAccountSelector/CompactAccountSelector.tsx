import { useNavigation } from '@react-navigation/core';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import type { Portfolio } from '@safely/core';
import { delay } from '@safely/core';
import { useActivePortfolio, usePortfolios } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { PortfoliosList } from '@mobile/features/portfolio/PortfoliosList';
import { TEST_ID } from '@mobile/shared/constants';
import {
    Button,
    ChevronDown16,
    Icon,
    PopupMenu,
    Sliders12,
    Sliders16,
    Text,
    Screen
} from '@mobile/shared/ui';
import type { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

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
        <View style={styles.touchableContainer} testID={TEST_ID.home.walletSelector}>
            <Animated.View style={[styles.innerTouchableContainer, innerAnimatedOpacity]}>
                <PortfolioName meta={portfolio.meta} />
                <Icon icon={ChevronDown16} color="tertiary" />
            </Animated.View>
        </View>
    );
};

export const CompactAccountSelector = () => {
    const popupMenuRef = useRef<PopupMenuRef>(null);
    const navigation = useNavigation();
    const { t } = useTranslation();

    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();

    return (
        <View style={styles.root}>
            <PopupMenu
                ref={popupMenuRef}
                header={
                    <View style={styles.settingsHeader}>
                        <Screen.Header.Button
                            type="transparent"
                            onPress={async () => {
                                popupMenuRef.current?.close();
                                await delay(100);
                                navigation.navigate('SettingsModal');
                            }}
                        >
                            <Icon icon={Sliders16} color="secondary" />
                        </Screen.Header.Button>
                    </View>
                }
                footer={
                    <View style={styles.footer}>
                        {portfolios.length > 1 && (
                            <Text variant="bodyM" color="secondary" textAlign="center">
                                {t('portfoliosPopup.reorderHint')}
                            </Text>
                        )}
                        <View style={styles.settingsHint}>
                            <Text variant="bodyM" color="tertiary">
                                {t('portfoliosPopup.settingsHint.1')}
                            </Text>
                            <View style={styles.settingsButton}>
                                <Icon icon={Sliders12} color="tertiary" />
                            </View>
                            <Text variant="bodyM" color="tertiary">
                                {t('portfoliosPopup.settingsHint.2')}
                            </Text>
                        </View>
                    </View>
                }
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
                        }}
                    />
                </View>
                <Button
                    testID={TEST_ID.accounts.addWallet}
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
        </View>
    );
};
