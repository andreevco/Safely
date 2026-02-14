import { useNavigation } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { Pressable } from 'react-native';

import { useAppContext } from '@safely/ux';

import { SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Text } from '@mobile/shared/ui';

import { styles } from './SettingsScreen.styles';

const TAP_COUNT = 5;
const TAP_WINDOW_MS = 1000;

export const VersionButton = () => {
    const { version } = useAppContext();
    const tapTimestamps = useRef<number[]>([]);
    const navigation = useNavigation<SettingsStackNavigationProp>();

    const handlePress = useCallback(() => {
        const now = Date.now();
        tapTimestamps.current.push(now);

        if (tapTimestamps.current.length >= TAP_COUNT) {
            const recentTaps = tapTimestamps.current.slice(-TAP_COUNT);

            if (now - recentTaps[0] <= TAP_WINDOW_MS) {
                tapTimestamps.current = [];
                navigation.navigate('DevToolsModal');
            }
        }
    }, [navigation]);

    return (
        <Pressable onPress={handlePress}>
            <Text variant="bodyM" color="tertiary" style={styles.versionText}>
                v{version}
            </Text>
        </Pressable>
    );
};
