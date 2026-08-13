import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useUnistyles } from 'react-native-unistyles';

import {
    AccountLinkState,
    useAccountLinkState,
    useIsAttentionRequired,
    useCompleteSyncOnboarding,
    useSyncOnboardingCompletedQuery
} from '@safely/ux';

import { DottedShieldIcon } from '@mobile/shared/resources';
import { Icon, Screen, ShieldCheckmark28 } from '@mobile/shared/ui';

import { ProtectedView } from './components/ProtectedView';
import { SoloView } from './components/SoloView';
import { SyncOnboarding } from './components/SyncOnboarding';
import { shouldShowSyncOnboarding } from './shouldShowSyncOnboarding';

type Theme = ReturnType<typeof useUnistyles>['theme'];

function resolveDotColor({
    isAttentionRequired,
    theme
}: {
    isAttentionRequired: boolean;
    theme: Theme;
}): string {
    return isAttentionRequired ? theme.colors.wallet.red : theme.colors.accent.orange;
}

export const SafetyScreen = () => {
    const { theme } = useUnistyles();

    const navigation = useNavigation();
    const linkState = useAccountLinkState();
    const isAttentionRequired = useIsAttentionRequired();

    useEffect(() => {
        navigation.setOptions({
            tabBarIcon: ({ color }: { color: string }) => {
                if (linkState === AccountLinkState.PROTECTED && !isAttentionRequired) {
                    return <Icon icon={ShieldCheckmark28} style={{ tintColor: color }} />;
                }

                return (
                    <DottedShieldIcon
                        size={28}
                        fillShield={color}
                        fillDot={resolveDotColor({ isAttentionRequired, theme })}
                    />
                );
            }
        });
    }, [linkState, isAttentionRequired, navigation, theme]);

    const { data: completed } = useSyncOnboardingCompletedQuery();
    const { mutateAsync: complete } = useCompleteSyncOnboarding();
    const [forceOpen, setForceOpen] = useState(false);

    const overlayVisible = shouldShowSyncOnboarding({
        forceOpen,
        completed
    });

    const handleOnboardingFinish = useCallback(() => {
        setForceOpen(false);
        void complete();
    }, [complete]);

    const handleConnect = useCallback(() => {
        navigation.navigate('LinkDeviceWarningModal');
    }, [navigation]);

    const renderContent = () => {
        switch (linkState) {
            case AccountLinkState.PROTECTED:
                return (
                    <ProtectedView
                        onLinkDevice={handleConnect}
                        onAbout={() => setForceOpen(true)}
                    />
                );
            case AccountLinkState.SOLO:
                return <SoloView onLinkDevice={handleConnect} onAbout={() => setForceOpen(true)} />;
            default:
                return null;
        }
    };

    return (
        <Screen>
            <Screen.Header />

            {renderContent()}

            {overlayVisible && <SyncOnboarding onFinish={handleOnboardingFinish} />}
        </Screen>
    );
};
