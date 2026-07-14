import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AccountLinkState, useAccountLinkState } from '@safely/ux';

import { Banner, ExclamationmarkCircle16 } from '@mobile/shared/ui';

import { styles } from './DeviceUnlinkedBanner.styles';

type DeviceUnlinkedBannerProps = {
    style?: StyleProp<ViewStyle>;
    inModal?: boolean;
};

export const DeviceUnlinkedBanner = ({ style, inModal = false }: DeviceUnlinkedBannerProps) => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const linkState = useAccountLinkState();

    const handlePress = useCallback(() => {
        if (inModal) {
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        { name: 'TabsNavigator', state: { routes: [{ name: 'SafetyScreen' }] } }
                    ]
                })
            );
            return;
        }

        navigation.navigate('TabsNavigator', { screen: 'SafetyScreen' });
    }, [inModal, navigation]);

    if (linkState !== AccountLinkState.UNLINKED) {
        return null;
    }

    return (
        <View style={[styles.container, style]}>
            <Banner variant="danger" onPress={handlePress}>
                <Banner.Content>
                    <Banner.Text>{t('deviceUnlinked.banner.text')}</Banner.Text>
                    <Banner.Icon icon={ExclamationmarkCircle16} />
                </Banner.Content>
            </Banner>
        </View>
    );
};
