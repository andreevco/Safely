import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { Pressable } from 'react-native';

import { useAppContext, useHasPortfolio } from '@safely/ux';

import { DeviceUnlinkedBanner } from '@mobile/features/device-link';
import { TEST_ID } from '@mobile/shared/constants';
import { List, Screen, Text } from '@mobile/shared/ui';

import { AccountSection } from '../AccountSection';
import { ApplicationSection } from '../ApplicationSection';
import { CurrentWalletSection } from '../CurrentWalletSection';
import { SettingsGroups } from '../SettingsGroups';
import { SignOutAccountButton } from '../SignOutAccountButton';
import { styles } from './SettingsContent.styles';

export const SettingsContent = () => {
    const { version } = useAppContext();
    const hasPortfolio = useHasPortfolio();
    const navigation = useNavigation();

    const openDevTools = useCallback(() => {
        navigation.navigate('SettingsModal', {
            screen: 'DevToolsModal'
        });
    }, [navigation]);

    return (
        <Screen.Scrollable contentContainerStyle={styles.container}>
            <DeviceUnlinkedBanner style={styles.banner} inModal />
            {hasPortfolio && <CurrentWalletSection />}
            <AccountSection />
            <ApplicationSection />
            <SettingsGroups />
            <List style={{ marginTop: 8 }}>
                <List.Group variant="separated">
                    <SignOutAccountButton />
                </List.Group>
            </List>
            <Pressable testID={TEST_ID.settings.devToolsTrigger} onLongPress={openDevTools}>
                <Text variant="bodyM" color="tertiary" textAlign="center" style={styles.version}>
                    Safely · {version}
                </Text>
            </Pressable>
        </Screen.Scrollable>
    );
};
