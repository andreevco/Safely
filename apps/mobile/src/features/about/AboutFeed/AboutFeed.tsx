import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import { View } from 'react-native';

import { Screen, Text } from '@mobile/shared/ui';
import { ListRef } from '@mobile/shared/ui/Screen/components/List';
import { useGroupedRows, getGroupedRowType, type GroupedRow } from '@mobile/shared/utils';

import { styles } from './AboutFeed.styles';
import { ABOUT_CARDS, type AboutCard } from './cards';
import { Content } from './components';

const getPublishedAt = (card: AboutCard) => card.publishedAt;
const getCardId = (card: AboutCard) => card.id;

export const AboutFeed = () => {
    const data = useGroupedRows(ABOUT_CARDS, getPublishedAt, getCardId);
    const listRef = useRef<ListRef<GroupedRow<AboutCard>>>(null);

    useScrollToTop(listRef);

    const renderItem = ({ item }: { item: GroupedRow<AboutCard> }) => {
        if (item.type === 'header') {
            return (
                <Text variant="bodyM" color="tertiary" style={styles.sectionTitle}>
                    {item.title}
                </Text>
            );
        }

        return (
            <View style={styles.card}>
                <Content blocks={item.item.blocks} />
            </View>
        );
    };

    return (
        <Screen.List
            ref={listRef}
            data={data}
            initialScrollIndex={data.length - 1}
            contentContainerStyle={styles.content}
            keyExtractor={item => item.key}
            getItemType={getGroupedRowType}
            renderItem={renderItem}
        />
    );
};
