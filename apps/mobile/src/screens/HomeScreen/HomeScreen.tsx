import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { useHasPortfolio } from '@safely/ux';

import { TabsNavigationProp } from '@mobile/app/navigation/types';
import { Chart } from '@mobile/features/chart';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Banner, InformationCircle28, Screen } from '@mobile/shared/ui';

import { HomeEmptyState } from './components';
import { styles } from './HomeScreen.styles';

export const HomeScreen = () => {
    const hasPortfolio = useHasPortfolio();
    const scrollRef = useRef<ScrollView>(null);
    const { t } = useTranslation();
    const navigation = useNavigation<TabsNavigationProp<'HomeScreen'>>();

    const handleBetaWarningPress = useCallback(() => {
        navigation.navigate('SafelyBetaScreen');
    }, [navigation]);

    useScrollToTop(scrollRef);

    return (
        <Screen>
            <HomeHeader />
            <Banner
                onPress={handleBetaWarningPress}
                style={styles.banner}
                variant="warning"
                icon={InformationCircle28}
                text={t('home.betaWarning')}
            />
            {hasPortfolio ? (
                <Screen.Scrollable ref={scrollRef}>
                    <TotalBalance />
                    <HomeActions />
                    <AssetsList />
                    <Chart />
                </Screen.Scrollable>
            ) : (
                <HomeEmptyState />
            )}
        </Screen>
    );
};
