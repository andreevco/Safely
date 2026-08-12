import type { ReactNode } from 'react';
import { View } from 'react-native';

import { styles } from '../AmountDisplayScreen.styles';

export const PreviewCard = ({ children }: { children: ReactNode }) => (
    <View style={styles.preview}>
        <View style={styles.previewCard}>{children}</View>
    </View>
);
