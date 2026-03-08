import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { getActiveConnector, useAccountConnectedCallback, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { DeviceLink, Screen, Text, TouchableOpacity } from '@mobile/shared/ui';
import { Icon } from '@mobile/shared/ui/Icon';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './SignInScreen.styles';

type SignInScreenProps = StaticScreenProps<{ connectionString: string }>;

export const SignInScreen = (props: SignInScreenProps) => {
    const { connectionString } = props.route.params;

    const { t } = useTranslation();
    const copy = useCopy();
    const toast = useToast();
    const connector = getActiveConnector();
    const navigation = useNavigation<RootStackNavigationProp>();

    useEffect(() => {
        return () => {
            connector.abort();
        };
    }, [connector]);

    const handleCopy = useCallback(() => {
        copy(connectionString);
    }, [copy, connectionString]);

    const handleConnected = useCallback(() => {
        navigation.navigate('SignInSuccessScreen');
    }, [navigation]);

    const handleError = useCallback(() => {
        navigation.goBack();
        toast(t('signIn.timeout'));
    }, [navigation, toast, t]);

    useAccountConnectedCallback(connector, handleConnected, {
        setAsActive: true,
        onError: handleError
    });

    return (
        <Screen>
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.qrContainer} onPress={handleCopy}>
                        <QRCode
                            shapeOptions={{
                                shape: 'square',
                                eyePatternShape: 'square'
                            }}
                            value={connectionString}
                            size={198}
                        />
                    </TouchableOpacity>
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('signIn.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('signIn.description')}
                        </Text>
                    </View>
                </View>
                <View style={styles.banner}>
                    <Text variant="bodyM" style={styles.bannerText}>
                        {t('signIn.banner')}
                    </Text>
                    <Icon style={styles.bannerIcon} icon={DeviceLink} />
                </View>
            </Screen.Content>
        </Screen>
    );
};
