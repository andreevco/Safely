import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Pressable } from 'react-native';

import { useAppContext, useHasPortfolio } from '@safely/ux';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { DeviceUnlinkedBanner } from '@mobile/features/device-link';
import { List, Screen, Text } from '@mobile/shared/ui';

import { AccountSection } from '../AccountSection';
import { CurrentWalletSection } from '../CurrentWalletSection';
import { RemovePortfolioButton } from '../RemovePortfolioButton';
import { SettingsGroups } from '../SettingsGroups';
import { SignOutAccountButton } from '../SignOutAccountButton';
import { styles } from './SettingsContent.styles';

export const SettingsContent = () => {
    const { version } = useAppContext();
    const hasPortfolio = useHasPortfolio();
    const navigation = useNavigation<SettingsStackNavigationProp>();

    const openDevTools = useCallback(() => {
        navigation.navigate('DevToolsModal');
    }, [navigation]);

    return (
        <Screen.Scrollable contentContainerStyle={styles.container}>
            <DeviceUnlinkedBanner style={styles.banner} />
            {hasPortfolio && <CurrentWalletSection />}
            <AccountSection />
            <SettingsGroups />
            <List style={{ marginTop: 8 }}>
                <List.Group variant="separated">
                    {hasPortfolio && <RemovePortfolioButton />}
                    <SignOutAccountButton />
                </List.Group>
            </List>
            <Pressable onLongPress={openDevTools}>
                <Text variant="bodyM" color="tertiary" textAlign="center" style={styles.version}>
                    Safely · {version}
                </Text>
            </Pressable>
        </Screen.Scrollable>
    );
};
