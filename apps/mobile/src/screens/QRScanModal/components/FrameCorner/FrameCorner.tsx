import { View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { FrameCorner48, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './FrameCorner.styles';

type FrameCornerProps = UnistylesVariants<typeof styles>;

export const FrameCorner = (props: FrameCornerProps) => {
    styles.useVariants(props);

    return (
        <View style={styles.corner}>
            <Icon icon={FrameCorner48} />
        </View>
    );
};
