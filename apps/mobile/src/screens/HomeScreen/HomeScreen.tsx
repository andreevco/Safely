import type { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Button, Screen } from '@mobile/shared/ui';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export const HomeScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    const { t } = useTranslation();

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Title>{t('home')}</Screen.Header.Title>
            </Screen.Header>
            <Screen.Scrollable>
                <Button onPress={() => navigation.navigate('HomeSheet')}>Go to sheet</Button>
                <Button onPress={() => navigation.navigate('HomeModal')}>Go to modal</Button>
            </Screen.Scrollable>
        </Screen>
    );
};
