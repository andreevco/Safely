import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Screen, Text } from '@mobile/shared/ui';
import { CameraLock96, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './NoCameraFound.styles';

export const NoCameraFound = () => {
    const { t } = useTranslation();

    return (
        <Screen background="primary">
            <Screen.Header>
                <Screen.Header.Title />
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Content style={styles.container}>
                <Icon icon={CameraLock96} />
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {t('camera.noCameraFound.title')}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {t('camera.noCameraFound.description')}
                    </Text>
                </View>
            </Screen.Content>
        </Screen>
    );
};
