import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';

import type { AboutPost } from '@safely/core';
import { useAboutQuery } from '@safely/ux';

import { Screen, Text } from '@mobile/shared/ui';
import type { ListRef } from '@mobile/shared/ui/Screen/components/List';
import { useGroupedRows, getGroupedRowType, type GroupedRow } from '@mobile/shared/utils';

import { styles } from './AboutFeed.styles';
import { PostCard, AboutFeedSkeleton } from './components';

const DESC_ORDER = { order: 'desc' } as const;

export const AboutFeed = () => {
    const { data, isLoading } = useAboutQuery();
    const posts = data?.posts;
    const rows = useGroupedRows(
        posts ?? [],
        p => p.timestamp * 1000,
        p => p.id,
        DESC_ORDER
    );
    const listRef = useRef<ListRef<GroupedRow<AboutPost>>>(null);

    useScrollToTop(listRef);

    const renderItem = ({ item }: { item: GroupedRow<AboutPost> }) => {
        if (item.type === 'header') {
            return (
                <Text variant="bodyM" color="tertiary" style={styles.sectionTitle}>
                    {item.title}
                </Text>
            );
        }

        return (
            <View style={styles.card}>
                <PostCard post={item.item} />
            </View>
        );
    };

    if (isLoading) {
        return <AboutFeedSkeleton />;
    }

    return (
        <Screen.List
            ref={listRef}
            data={rows}
            contentContainerStyle={styles.content}
            keyExtractor={item => item.key}
            getItemType={getGroupedRowType}
            renderItem={renderItem}
        />
    );
};
