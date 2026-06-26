import { useNavigation } from '@react-navigation/core';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { useAccountConnectedCallback, useCreateReconnectConnector, useToast } from '@safely/ux';

import { DeviceLink, Screen, Text, TouchableOpacity } from '@mobile/shared/ui';
import { Icon } from '@mobile/shared/ui/Icon';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './ReconnectDeviceModal.styles';

export const ReconnectDeviceModal = () => {
    const { t } = useTranslation();
    const copy = useCopy();
    const toast = useToast();
    const navigation = useNavigation();

    const { mutate, data, isPending, isError } = useCreateReconnectConnector();
    useAccountConnectedCallback(
        data,
        useCallback(() => {
            navigation.goBack();
            toast(t('deviceUnlinked.reconnect.successToast'));
        }, [navigation, t, toast]),
        {
            setAsActive: true,
            onError: useCallback(() => navigation.goBack(), [navigation])
        }
    );

    useEffect(() => {
        mutate();
    }, [mutate]);

    useEffect(() => {
        if (isError) navigation.goBack();
    }, [isError, navigation]);

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.qrContainer}
                        onPress={data ? () => copy(data.connectionString) : undefined}
                    >
                        {data ? (
                            <QRCode
                                shapeOptions={{
                                    shape: 'square',
                                    eyePatternShape: 'square'
                                }}
                                value={data.connectionString}
                                size={198}
                            />
                        ) : (
                            <View style={styles.qrPlaceholder}>
                                {isPending && <ActivityIndicator />}
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('deviceUnlinked.reconnect.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('deviceUnlinked.reconnect.description')}
                        </Text>
                    </View>
                </View>
                <View style={styles.banner}>
                    <Text variant="bodyM" style={styles.bannerText}>
                        {t('deviceUnlinked.reconnect.banner')}
                    </Text>
                    <Icon style={styles.bannerIcon} icon={DeviceLink} />
                </View>
            </Screen.Content>
        </Screen>
    );
};
