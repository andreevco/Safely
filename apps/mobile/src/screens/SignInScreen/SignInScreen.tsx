import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-skia';

import { OnboardingConnector, useAccountConnectedCallback, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { DeviceLink, Screen, Text, TouchableOpacity } from '@mobile/shared/ui';
import { Icon, Sliders12 } from '@mobile/shared/ui/Icon';
import { useCopy } from '@mobile/shared/utils/copy';

import { styles } from './SignInScreen.styles';

type SignInScreenProps = StaticScreenProps<{
    connector: OnboardingConnector;
    closeStorage: () => void;
    onSuccess: () => void;
}>;

export const SignInScreen = (props: SignInScreenProps) => {
    const { connector, closeStorage, onSuccess } = props.route.params;

    const { t } = useTranslation();
    const copy = useCopy();
    const toast = useToast();
    const navigation = useNavigation<RootStackNavigationProp>();

    const connectedRef = useRef(false);

    useEffect(() => {
        return () => {
            if (!connectedRef.current) {
                connector.abort();
            }
        };
    }, [connector]);

    useEffect(() => closeStorage, [closeStorage]);

    const handleCopy = useCallback(() => {
        copy(connector.connectionString);
    }, [copy, connector.connectionString]);

    const handleConnected = useCallback(() => {
        connectedRef.current = true;
        onSuccess();
    }, [onSuccess]);

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
                            value={connector.connectionString}
                            size={198}
                        />
                    </TouchableOpacity>
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('signIn.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('signIn.description.top')}
                        </Text>
                        <View style={styles.iconLine}>
                            <Text variant="bodyL" color="secondary">
                                {t('signIn.description.iconLineStart')}
                            </Text>
                            <View style={styles.inlineSettingsIconContainer}>
                                <Icon icon={Sliders12} />
                            </View>
                            <Text variant="bodyL" color="secondary">
                                {t('signIn.description.iconLineEnd')}
                            </Text>
                        </View>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('signIn.description.bottom')}
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
