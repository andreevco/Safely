import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';

import {
    AccountLinkState,
    useAccountLinkState,
    useCompleteSyncOnboarding,
    useSyncOnboardingCompletedQuery
} from '@safely/ux';

import { DottedShieldIcon } from '@mobile/shared/resources';
import { Button, Icon, Screen, ShieldCheckmark28 } from '@mobile/shared/ui';

import { ProtectedView } from './components/ProtectedView';
import { SoloView } from './components/SoloView';
import { SyncOnboarding } from './components/SyncOnboarding';
import { UnlinkedView } from './components/UnlinkedView';
import { styles } from './SafetyScreen.styles';
import { shouldShowSyncOnboarding } from './shouldShowSyncOnboarding';

export const SafetyScreen = () => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const navigation = useNavigation();
    const linkState = useAccountLinkState();
    const isFocused = useIsFocused();

    useEffect(() => {
        navigation.setOptions({
            tabBarIcon: ({ color }: { color: string }) => {
                if (linkState === AccountLinkState.PROTECTED) {
                    return <Icon icon={ShieldCheckmark28} style={{ tintColor: color }} />;
                }

                return (
                    <DottedShieldIcon
                        size={28}
                        fillShield={color}
                        fillDot={
                            linkState === AccountLinkState.UNLINKED
                                ? theme.colors.accent.red
                                : theme.colors.accent.orange
                        }
                    />
                );
            }
        });
    }, [linkState, navigation, theme]);

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
            case AccountLinkState.UNLINKED:
                return isFocused ? <UnlinkedView /> : null;
            default:
                return null;
        }
    };

    return (
        <Screen>
            <Screen.Header>
                {linkState === AccountLinkState.UNLINKED && (
                    <Button
                        style={styles.headerButton}
                        size="small"
                        type="secondary"
                        onPress={() => setForceOpen(true)}
                    >
                        {t('safety.aboutSync')}
                    </Button>
                )}
            </Screen.Header>

            {renderContent()}

            {overlayVisible && <SyncOnboarding onFinish={handleOnboardingFinish} />}
        </Screen>
    );
};
