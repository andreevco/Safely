import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type TFunction } from 'i18next';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    type ActivityItemsDatedGroup,
    type BtcActivityItem,
    useDateFormatter,
    DateFormatter,
    useGroupedHistory,
    useInterval,
    assetKeys
} from '@safely/ux';
import { ACTIVITY_GROUP_LABEL, ActivityItemsDatedGroupMeta } from '@safely/ux';

import { ActivityItem } from '@mobile/entities/activity';
import { ActivityItemTimeFormatDetails } from '@mobile/entities/activity/ActivityItem/ActivityItem';
import { Screen, Text } from '@mobile/shared/ui';
import { ListRef } from '@mobile/shared/ui/Screen/components/List';
import { useScrollPosition } from '@mobile/shared/utils';

import { HistoryEmptyPlaceholder } from '../HistoryEmptyPlaceholder';
import { styles } from './HistoryList.styles';

type HistoryRowItem =
    | { key: string; type: 'header'; title: string }
    | {
          key: string;
          type: 'activity';
          activity: BtcActivityItem;
          timeFormatDetails: ActivityItemTimeFormatDetails;
      };

const getGroupKey = (meta: ActivityItemsDatedGroupMeta) => {
    return JSON.stringify(meta);
};

const getFirstActivityKey = (groups: ActivityItemsDatedGroup[] | undefined): string | undefined =>
    groups?.[0]?.items?.[0]?.key;

const getGroupTitle = (
    meta: ActivityItemsDatedGroupMeta,
    t: TFunction,
    formatter: DateFormatter
): string => {
    const today = new Date();
    switch (meta.label) {
        case ACTIVITY_GROUP_LABEL.TODAY:
            return t('history.dateHeaders.today');
        case ACTIVITY_GROUP_LABEL.YESTERDAY:
            return t('history.dateHeaders.yesterday');
        case ACTIVITY_GROUP_LABEL.THIS_MONTH: {
            const date = new Date(today.getFullYear(), today.getMonth(), meta.day);

            return formatter({
                month: 'long',
                day: 'numeric'
            }).format(date);
        }
        case ACTIVITY_GROUP_LABEL.THIS_YEAR: {
            const date = new Date(2000, meta.month, 1);

            return formatter({
                month: 'long'
            }).format(date);
        }
        case ACTIVITY_GROUP_LABEL.PAST_YEAR: {
            const date = new Date(meta.year, meta.month, 1);

            return formatter({
                month: 'long',
                year: 'numeric'
            }).format(date);
        }
    }
};

type HistoryListProps = {
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

const timeFormatDetailsMap: Record<ACTIVITY_GROUP_LABEL, ActivityItemTimeFormatDetails> = {
    [ACTIVITY_GROUP_LABEL.TODAY]: 'time',
    [ACTIVITY_GROUP_LABEL.YESTERDAY]: 'time',
    [ACTIVITY_GROUP_LABEL.THIS_MONTH]: 'time',
    [ACTIVITY_GROUP_LABEL.THIS_YEAR]: 'day-month-time',
    [ACTIVITY_GROUP_LABEL.PAST_YEAR]: 'day-month-time'
};

export const HistoryList = (props: HistoryListProps) => {
    const { onNavigateToTransaction } = props;
    const { t } = useTranslation();

    const formatter = useDateFormatter();

    const isFocused = useIsFocused();
    const listRef = useRef<ListRef<HistoryRowItem> | null>(null);
    const { data: historyGroups, refetch, fetchNextPage } = useGroupedHistory();
    const { atTop, onScroll } = useScrollPosition({ threshold: 100 });
    const client = useQueryClient();

    const { mutate: runIntervalRefetch } = useMutation({
        async mutationFn() {
            const currentFirstKey = getFirstActivityKey(historyGroups);
            const result = await refetch();
            const newFirstKey = getFirstActivityKey(result.data);
            if (currentFirstKey !== newFirstKey) {
                setTimeout(() => {
                    listRef.current?.scrollToOffset({ offset: 0, animated: true });
                }, 50);
                client.invalidateQueries({ queryKey: assetKeys.all.toKey() });
            }
        }
    });

    useInterval(() => runIntervalRefetch(), atTop && isFocused ? 2000 : null);

    const { mutateAsync: manuallyRefetch, isPending: isRefetching } = useMutation({
        async mutationFn() {
            await refetch();
        }
    });

    const rows = useMemo<HistoryRowItem[] | undefined>(() => {
        return historyGroups?.flatMap(item => {
            const { items: groupActivity, ...meta } = item;
            const groupKey = getGroupKey(meta);

            const header = {
                key: `header-${groupKey}`,
                type: 'header' as const,
                title: getGroupTitle(meta, t, formatter)
            };

            const activity = groupActivity.map(a => ({
                type: 'activity' as const,
                key: `activity-${groupKey}-${a.key}`,
                activity: a,
                timeFormatDetails: timeFormatDetailsMap[meta.label]
            }));
            return [header, ...activity];
        });
    }, [formatter, historyGroups, t]);

    if (!rows) {
        return null;
    }

    if (rows.length === 0) {
        return <HistoryEmptyPlaceholder />;
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
                        timeFormatDetails={item.timeFormatDetails}
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
            ref={listRef}
            contentContainerStyle={styles.contentContainer}
            refreshing={isRefetching}
            onRefresh={manuallyRefetch}
            onScroll={onScroll}
            data={rows}
            keyExtractor={item => item.key}
            onEndReached={fetchNextPage}
            onEndReachedThreshold={0.5}
            ItemSeparatorComponent={renderSeparator}
            renderItem={renderItem}
        />
    );
};
