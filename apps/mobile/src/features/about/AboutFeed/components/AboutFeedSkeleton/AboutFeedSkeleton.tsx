import { View } from 'react-native';

import { Text } from '@mobile/shared/ui';

import { styles } from './AboutFeedSkeleton.styles';

const SKELETON_CARDS = Array.from({ length: 2 }, (_, index) => `skeleton-${index}`);

const PostCardSkeleton = () => {
    return (
        <View style={styles.card}>
            <Text variant="bodyM" skeleton skeletonWidth={240} />
            <Text variant="bodyM" skeleton skeletonWidth={160} />
        </View>
    );
};

export const AboutFeedSkeleton = () => {
    return (
        <View style={styles.content}>
            <View style={styles.skeletonLabel}>
                <Text variant="bodyM" skeleton skeletonWidth={60} />
            </View>
            {SKELETON_CARDS.map(id => (
                <PostCardSkeleton key={id} />
            ))}
        </View>
    );
};
