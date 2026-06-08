import { View } from 'react-native';

import { Skeleton } from '@mobile/shared/ui';

import { styles } from './ChartLine.styles';

export const ChartLineSkeleton = () => {
    return (
        <View style={[styles.container, styles.skeletonContainer]}>
            <Skeleton width="auto" height={1} borderRadius={0} />
        </View>
    );
};
