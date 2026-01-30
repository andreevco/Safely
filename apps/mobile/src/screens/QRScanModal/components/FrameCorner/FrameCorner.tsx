import { FrameCorner48, Icon } from '@mobile/shared/ui/Icon';
import { View } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

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
