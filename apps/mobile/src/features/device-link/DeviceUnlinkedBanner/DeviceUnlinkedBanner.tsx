import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AccountLinkState, useAccountLinkState } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Banner, ExclamationmarkCircle16 } from '@mobile/shared/ui';

import { styles } from './DeviceUnlinkedBanner.styles';

export const DeviceUnlinkedBanner = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const linkState = useAccountLinkState();

    const handlePress = useCallback(() => {
        navigation.navigate('ReconnectDeviceModal');
    }, [navigation]);

    if (linkState !== AccountLinkState.UNLINKED) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Banner variant="danger" onPress={handlePress}>
                <Banner.Content>
                    <Banner.Text>{t('deviceUnlinked.banner.text')}</Banner.Text>
                    <Banner.Icon icon={ExclamationmarkCircle16} />
                </Banner.Content>
            </Banner>
        </View>
    );
};
