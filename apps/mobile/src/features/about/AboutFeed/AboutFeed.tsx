import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';

import { type AboutPost } from '@safely/core';
import { useAboutQuery } from '@safely/ux';

import { Screen, Text } from '@mobile/shared/ui';
import { ListRef } from '@mobile/shared/ui/Screen/components/List';
import { useGroupedRows, getGroupedRowType, type GroupedRow } from '@mobile/shared/utils';

import { styles } from './AboutFeed.styles';
import { PostCard } from './components';

export const AboutFeed = () => {
    const { data } = useAboutQuery();
    const posts = data?.posts;
    const rows = useGroupedRows(
        posts ?? [],
        p => p.timestamp * 1000,
        p => p.id
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

    if (!posts) {
        return null;
    }

    return (
        <Screen.List
            ref={listRef}
            data={rows}
            initialScrollIndex={Math.max(rows.length - 1, 0)}
            contentContainerStyle={styles.content}
            keyExtractor={item => item.key}
            getItemType={getGroupedRowType}
            renderItem={renderItem}
        />
    );
};
