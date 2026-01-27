import { Button, Screen, Text } from '@mobile/shared/ui';
import { CameraLock96, Icon } from '@mobile/shared/ui/Icon';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { styles } from './PermissionRequest.styles';

export const PermissionRequest = () => {
    const { t } = useTranslation();

    const handleOpenSettings = () => {
        Linking.openSettings();
    };

    return (
        <Screen background="primary">
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <View style={styles.container}>
                <Icon icon={CameraLock96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('camera.permissionRequest.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('camera.permissionRequest.description')}
                    </Text>
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <Button size="large" type="primary" onPress={handleOpenSettings}>
                    {t('camera.permissionRequest.button')}
                </Button>
            </View>
        </Screen>
    );
};
