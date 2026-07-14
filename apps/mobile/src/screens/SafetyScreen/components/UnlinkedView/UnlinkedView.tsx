import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { useAccountConnectedCallback, useCreateReconnectConnector, useToast } from '@safely/ux';

import { Screen, Text, TouchableOpacity } from '@mobile/shared/ui';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './UnlinkedView.styles';

export const UnlinkedView = () => {
    const { t } = useTranslation();
    const copy = useCopy();
    const toast = useToast();

    const { mutate, data, isPending } = useCreateReconnectConnector();

    useAccountConnectedCallback(
        data,
        useCallback(() => {
            toast(t('deviceUnlinked.reconnect.successToast'));
        }, [t, toast]),
        {
            setAsActive: true,
            onError: useCallback(() => toast(t('deviceUnlinked.reconnect.timeout')), [t, toast])
        }
    );

    useEffect(() => {
        mutate();
    }, [mutate]);

    return (
        <Screen.Content>
            <View style={styles.content}>
                {data ? (
                    <TouchableOpacity
                        style={styles.qrContainer}
                        onPress={() => copy(data.connectionString)}
                    >
                        <QRCode
                            shapeOptions={{
                                shape: 'square',
                                eyePatternShape: 'square'
                            }}
                            value={data.connectionString}
                            size={198}
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.qrContainer}>
                        <View style={styles.qrPlaceholder}>
                            {isPending && <ActivityIndicator />}
                        </View>
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('deviceUnlinked.reconnect.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('deviceUnlinked.reconnect.description')}
                    </Text>
                </View>
            </View>
        </Screen.Content>
    );
};
