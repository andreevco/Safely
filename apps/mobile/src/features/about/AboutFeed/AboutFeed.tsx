import { useScrollToTop } from '@react-navigation/native';
import { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { Screen, Text } from '@mobile/shared/ui';
import { ListRef } from '@mobile/shared/ui/Screen/components/List';
import { useGroupedItems } from '@mobile/shared/utils';

import { styles } from './AboutFeed.styles';
import { ABOUT_CARDS, type AboutCard } from './cards';
import { Content } from './components';

type AboutRow =
    | { key: string; type: 'header'; title: string }
    | { key: string; type: 'card'; card: AboutCard };

export const AboutFeed = () => {
    const sections = useGroupedItems(ABOUT_CARDS, card => card.publishedAt);
    const listRef = useRef<ListRef<AboutRow>>(null);

    useScrollToTop(listRef);

    const data = useMemo<AboutRow[]>(() => {
        const rows: AboutRow[] = [];

        for (const section of sections) {
            rows.push({ key: `header-${section.key}`, type: 'header', title: section.title });

            for (const card of section.items) {
                rows.push({ key: `card-${card.id}`, type: 'card', card });
            }
        }

        return rows;
    }, [sections]);

    const getItemType = useCallback((item: AboutRow) => item.type, []);

    const renderItem = ({ item }: { item: AboutRow }) => {
        if (item.type === 'header') {
            return (
                <Text variant="bodyM" color="tertiary" style={styles.sectionTitle}>
                    {item.title}
                </Text>
            );
        }

        return (
            <View style={styles.card}>
                <Content blocks={item.card.blocks} />
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
            getItemType={getItemType}
            renderItem={renderItem}
        />
    );
};
