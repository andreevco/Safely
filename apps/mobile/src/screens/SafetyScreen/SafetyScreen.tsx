import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import {
    AccountLinkState,
    useAccountLinkState,
    useAppContext,
    useConnectAccountToNewDevice,
    useCompleteSyncOnboarding,
    useSyncOnboardingCompletedQuery
} from '@safely/ux';

import { DottedShieldIcon } from '@mobile/shared/resources';
import { Button, Icon, Screen, ShieldCheckmark28, Xmark16 } from '@mobile/shared/ui';
import { Button as HeaderButton } from '@mobile/shared/ui/Screen/components/Header/components/Button';

import { ProtectedView } from './components/ProtectedView';
import { SoloView } from './components/SoloView';
import { SyncOnboarding } from './components/SyncOnboarding';
import { UnlinkedView } from './components/UnlinkedView';
import { styles } from './SafetyScreen.styles';
import { shouldShowSyncOnboarding } from './shouldShowSyncOnboarding';

export const SafetyScreen = () => {
    const { t } = useTranslation();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { theme } = useUnistyles();
    const { mutateAsync: connectToNewDevice } = useConnectAccountToNewDevice();

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

    const handleClose = useCallback(() => {
        navigation.navigate('TabsNavigator', { screen: 'HomeStack' });
    }, [navigation]);

    const handleConnect = useCallback(async () => {
        using secureEncryptedStorage = getSecureEncrypted();
        await secureEncryptedStorage.unlock();

        await connectToNewDevice({ secureEncryptedStorage });
    }, [getSecureEncrypted, connectToNewDevice]);

    const renderContent = () => {
        switch (linkState) {
            case AccountLinkState.PROTECTED:
                return <ProtectedView />;
            case AccountLinkState.SOLO:
                return <SoloView />;
            case AccountLinkState.UNLINKED:
                return isFocused ? <UnlinkedView /> : null;
            default:
                return null;
        }
    };

    return (
        <Screen>
            <Screen.Header>
                <Button
                    style={styles.headerButton}
                    size="small"
                    type="secondary"
                    onPress={() => setForceOpen(true)}
                >
                    {t('safety.aboutSync')}
                </Button>
                <HeaderButton onPress={handleClose}>
                    <Icon icon={Xmark16} />
                </HeaderButton>
            </Screen.Header>

            {renderContent()}

            {linkState !== AccountLinkState.UNLINKED && (
                <View style={styles.buttonContainer}>
                    <Button
                        type={linkState === AccountLinkState.SOLO ? 'primary' : 'secondary'}
                        size="large"
                        onPress={handleConnect}
                    >
                        {t('safety.linkDevice')}
                    </Button>
                </View>
            )}

            {overlayVisible && <SyncOnboarding onFinish={handleOnboardingFinish} />}
        </Screen>
    );
};
