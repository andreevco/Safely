import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { BTC_ASSET } from '@safely/core';
import { useIsActiveWalletWatchOnly, useScanQrScheme } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Actions } from '@mobile/shared/ui';
import { ArrowDown28, ArrowTop28, QrCodeScan28 } from '@mobile/shared/ui/Icon';

import { styles } from './HomeActions.styles';

const WATCH_ONLY_OPACITY = 0.56;

export const HomeActions = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const isWatchOnly = useIsActiveWalletWatchOnly();

    const handleQRScan = useScanQrScheme({
        onResult: useCallback(
            scheme => {
                switch (scheme.name) {
                    case 'btc-transfer':
                        navigation.navigate('SendAssetModal', {
                            screen: 'SendAssetModal',
                            params: {
                                address: scheme.parsed.address,
                                amount: scheme.parsed.amount
                            }
                        });
                        break;
                }
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

    const handleWatchOnlyAction = useCallback(() => {
        navigation.navigate('WatchOnlySheet');
    }, [navigation]);

    return (
        <Actions style={styles.container}>
            <Actions.Button
                title={t('home.actions.send')}
                icon={ArrowTop28}
                onPress={isWatchOnly ? handleWatchOnlyAction : handleNavigateToSendAsset}
                opacity={isWatchOnly ? WATCH_ONLY_OPACITY : 1}
            />
            <Actions.Button
                title={t('home.actions.receive')}
                icon={ArrowDown28}
                onPress={handleNavigateToReceiveAsset}
            />
            <Actions.Button
                title={t('home.actions.scan')}
                icon={QrCodeScan28}
                onPress={isWatchOnly ? handleWatchOnlyAction : handleQRScan}
                opacity={isWatchOnly ? WATCH_ONLY_OPACITY : 1}
            />
        </Actions>
    );
};
