import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { useAccountConnectedCallback, useCreateReconnectConnector, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { resources } from '@mobile/shared/resources';
import { Screen, Text, TouchableOpacity } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './ReconnectDeviceModal.styles';

export const ReconnectDeviceModal = () => {
    const { t } = useTranslation();
    const copy = useCopy();
    const toast = useToast();
    const navigation = useNavigation<RootStackNavigationProp>();

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
                            {t('deviceUnlinked.reconnect.description.beforeIcon')}
                            <Image source={resources.slidersBoxed} style={styles.iconImage} />
                            {t('deviceUnlinked.reconnect.description.afterIcon')}
                        </Text>
                    </View>
                </View>
            </Screen.Content>
        </Screen>
    );
};
