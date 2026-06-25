import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { resources } from '@mobile/shared/resources';
import { Image } from '@mobile/shared/ui';
import { smoothstepGradient } from '@mobile/shared/utils';

import { styles } from './WelcomeBackground.styles';

const BACKGROUND_GRADIENT_COLORS = [
    '#0178FF',
    '#0177FD',
    '#0174F6',
    '#026FEB',
    '#0368DB',
    '#045FC7',
    '#0554AF',
    '#064894',
    '#073C78',
    '#08305D',
    '#092545',
    '#0A1C31',
    '#0B1521',
    '#0C1016',
    '#0C0D0F',
    '#0C0C0D'
] as const;

export const WelcomeBackground = () => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <LinearGradient colors={BACKGROUND_GRADIENT_COLORS} style={styles.gradient} />
            <Image source={resources.welcomeScreenBg} style={styles.background} />
            <LinearGradient
                colors={smoothstepGradient(theme.colors.background.primary)}
                style={styles.gradient}
            />
        </View>
    );
};
