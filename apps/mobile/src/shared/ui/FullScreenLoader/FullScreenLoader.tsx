import { View } from 'react-native';

import { CircularSpinner } from './components/CircularSpinner';
import { styles } from './FullScreenLoader.styles';

export interface FullScreenLoaderProps {
    visible: boolean;
}

export const FullScreenLoader = ({ visible }: FullScreenLoaderProps) => {
    if (!visible) {
        return null;
    }

    return (
        <View style={styles.overlay} pointerEvents="none">
            <View style={styles.backdrop} />
            <View style={styles.container}>
                <CircularSpinner />
            </View>
        </View>
    );
};
