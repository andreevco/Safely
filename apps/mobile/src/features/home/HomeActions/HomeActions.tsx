import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { BTC_ASSET } from '@safely/core';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { useQrScan } from '@mobile/features/qr-scan';
import { Actions } from '@mobile/shared/ui';
import { ArrowDown28, ArrowTop28, QrCodeScan28 } from '@mobile/shared/ui/Icon';

import { styles } from './HomeActions.styles';

export const HomeActions = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    const handleQRScan = useQrScan({
        onSuccess: useCallback(
            (address: string) => {
                navigation.navigate('SendAssetModal', {
                    screen: 'SendAssetModal',
                    params: { address }
                });
            },
            [navigation]
        )
    });

    const handleNavigateToReceiveAsset = useCallback(() => {
        navigation.navigate('ReceiveAssetModal', {
            asset: BTC_ASSET
        });
    }, [navigation]);

    const handleNavigateToSendAsset = useCallback(() => {
        navigation.navigate('SendAssetModal');
    }, [navigation]);

    return (
        <Actions style={styles.container}>
            <Actions.Button
                title={t('home.actions.send')}
                icon={ArrowTop28}
                onPress={handleNavigateToSendAsset}
            />
            <Actions.Button
                title={t('home.actions.receive')}
                icon={ArrowDown28}
                onPress={handleNavigateToReceiveAsset}
            />
            <Actions.Button
                title={t('home.actions.scan')}
                icon={QrCodeScan28}
                onPress={handleQRScan}
            />
        </Actions>
    );
};
