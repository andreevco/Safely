import { type TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type BtcActivityItem, useHistory } from '@safely/ux';

import { ActivityItem } from '@mobile/entities/activity';
import { Screen, Text } from '@mobile/shared/ui';
import { diffInDays } from '@mobile/shared/utils';

import { styles } from './HistoryList.styles';

type HistoryRowItem =
    | { key: string; type: 'header'; title: string }
    | { key: string; type: 'activity'; activity: BtcActivityItem };

const getGroupKey = (date: Date, baseDate: Date) => {
    const diff = diffInDays(date, baseDate);
    if (diff === 0) return 'today';
    if (diff === 1) return 'yesterday';
    return `${date.getFullYear()}-${date.getMonth()}`;
};

const getGroupTitle = (
    groupKey: string,
    date: Date,
    t: TFunction,
    formatter: Intl.DateTimeFormat
): string => {
    if (groupKey === 'today') return t('history.dateHeaders.today');
    if (groupKey === 'yesterday') return t('history.dateHeaders.yesterday');
    return formatter.format(date);
};

type HistoryListProps = {
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

export const HistoryList = (props: HistoryListProps) => {
    const { onNavigateToTransaction } = props;
    const history = useHistory();
    const { t, i18n } = useTranslation();

    const items = useMemo(
        () => history.data?.pages.flatMap(page => page.items) ?? [],
        [history.data]
    );
    const rows = useMemo<HistoryRowItem[]>(() => {
        const baseDate = new Date();
        const formatter = new Intl.DateTimeFormat(i18n.language, { month: 'long' });
        const result: HistoryRowItem[] = [];
        let previousGroupKey: string | null = null;

        items.forEach(item => {
            const itemDate = new Date(item.timestamp);
            const groupKey = getGroupKey(itemDate, baseDate);

            if (groupKey !== previousGroupKey) {
                result.push({
                    key: `header-${groupKey}`,
                    type: 'header',
                    title: getGroupTitle(groupKey, itemDate, t, formatter)
                });
                previousGroupKey = groupKey;
            }

            result.push({
                key: item.key,
                type: 'activity',
                activity: item
            });
        });

        return result;
    }, [i18n.language, items, t]);

    if (!history.data) {
        return null;
    }

    const renderSeparator = () => {
        return <View style={styles.separator} />;
    };

    const renderItem = ({ item, index }: { item: HistoryRowItem; index: number }) => {
        switch (item.type) {
            case 'header':
                return (
                    <View
                        style={[
                            styles.sectionHeaderContainer,
                            index === 0 && styles.firstSectionHeaderContainer
                        ]}
                    >
                        <Text color="primary" variant="labelM" textTransform="capitalize">
                            {item.title}
                        </Text>
                    </View>
                );
            case 'activity':
                return (
                    <ActivityItem
                        activity={item.activity}
                        onNavigateToTransaction={onNavigateToTransaction}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Screen.List
            contentContainerStyle={styles.contentContainer}
            onRefresh={history.refetch}
            refreshing={history.isRefetching}
            data={rows}
            keyExtractor={item => item.key}
            onEndReached={history.fetchNextPage}
            onEndReachedThreshold={0.5}
            ItemSeparatorComponent={renderSeparator}
            renderItem={renderItem}
        />
    );
};
