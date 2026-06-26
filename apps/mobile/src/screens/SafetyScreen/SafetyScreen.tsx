import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    AccountLinkState,
    useAccountLinkState,
    useAppContext,
    useConnectAccountToNewDevice,
    useSyncOnboardingCompletedQuery
} from '@safely/ux';

import { Button, Screen } from '@mobile/shared/ui';

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
    const { mutateAsync: connectToNewDevice } = useConnectAccountToNewDevice();

    const linkState = useAccountLinkState();
    const isFocused = useIsFocused();

    const { data: completed } = useSyncOnboardingCompletedQuery();
    const [forceOpen, setForceOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useFocusEffect(useCallback(() => () => setDismissed(false), []));

    const overlayVisible = shouldShowSyncOnboarding({
        forceOpen,
        completed,
        dismissed
    });

    const handleOnboardingClose = useCallback(() => {
        setForceOpen(false);
        setDismissed(true);
    }, []);

    const handleOnboardingFinish = useCallback(() => {
        setForceOpen(false);
    }, []);

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

            {overlayVisible && (
                <SyncOnboarding onClose={handleOnboardingClose} onFinish={handleOnboardingFinish} />
            )}
        </Screen>
    );
};
