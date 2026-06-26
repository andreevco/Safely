import { useFocusEffect } from '@react-navigation/native';
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

            {linkState === AccountLinkState.PROTECTED && <ProtectedView />}
            {[AccountLinkState.SOLO, AccountLinkState.UNLINKED].includes(linkState) && <SoloView />}

            <View style={styles.buttonContainer}>
                <Button
                    type={
                        [AccountLinkState.UNLINKED, AccountLinkState.SOLO].includes(linkState)
                            ? 'primary'
                            : 'secondary'
                    }
                    size="large"
                    onPress={handleConnect}
                >
                    {t('safety.linkDevice')}
                </Button>
            </View>

            {overlayVisible && (
                <SyncOnboarding onClose={handleOnboardingClose} onFinish={handleOnboardingFinish} />
            )}
        </Screen>
    );
};
