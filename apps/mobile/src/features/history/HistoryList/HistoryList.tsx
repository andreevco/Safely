import { useIsFocused, useScrollToTop } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { type TFunction } from 'i18next';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    type ActivityItemsDatedGroup,
    type BtcActivityItem,
    useDateFormatter,
    DateFormatter,
    useGroupedHistory,
    useInterval,
    useMutation,
    assetKeys
} from '@safely/ux';
import { ACTIVITY_GROUP_LABEL, ActivityItemsDatedGroupMeta } from '@safely/ux';

import { ActivityItem } from '@mobile/entities/activity';
import { ActivityItemTimeFormatDetails } from '@mobile/entities/activity/ActivityItem/ActivityItem';
import { Screen, Text } from '@mobile/shared/ui';
import { ListRef } from '@mobile/shared/ui/Screen/components/List';

import { HistoryEmptyPlaceholder } from '../HistoryEmptyPlaceholder';
import { NewTransactionsBubble, useNewTransactionsBubble } from './components';
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
    switch (meta.label) {
        case ACTIVITY_GROUP_LABEL.PENDING:
            return t('history.dateHeaders.pending');
        case ACTIVITY_GROUP_LABEL.TODAY:
            return t('history.dateHeaders.today');
        case ACTIVITY_GROUP_LABEL.YESTERDAY:
            return t('history.dateHeaders.yesterday');
        case ACTIVITY_GROUP_LABEL.THIS_MONTH: {
            const date = new Date(meta.year, meta.month, meta.day);
            return formatter({ month: 'long', day: 'numeric' }).format(date);
        }
        case ACTIVITY_GROUP_LABEL.THIS_YEAR: {
            const date = new Date(meta.year, meta.month, 1);
            return formatter({ month: 'long' }).format(date);
        }
        case ACTIVITY_GROUP_LABEL.PAST_YEAR: {
            const date = new Date(meta.year, meta.month, 1);
            return formatter({ month: 'long', year: 'numeric' }).format(date);
        }
    }
};

type HistoryListProps = {
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

const timeFormatDetailsMap: Record<ACTIVITY_GROUP_LABEL, ActivityItemTimeFormatDetails> = {
    [ACTIVITY_GROUP_LABEL.PENDING]: 'time',
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
    const listRef = useRef<ListRef<HistoryRowItem>>(null);
    const { data: historyGroups, refetch, fetchNextPage } = useGroupedHistory();
    const client = useQueryClient();

    useScrollToTop(listRef);

    const {
        scrollHandler,
        mode: bubbleMode,
        onPress: onBubblePress,
        show: showBubble
    } = useNewTransactionsBubble({
        listRef,
        // height of one history item + group label, but should think about better way maybe
        topThreshold: 128
    });

    const { mutate: runIntervalRefetch } = useMutation({
        async mutationFn() {
            const currentFirstKey = getFirstActivityKey(historyGroups);
            const result = await refetch();
            const newFirstKey = getFirstActivityKey(result.data);
            if (currentFirstKey !== newFirstKey) {
                client.invalidateQueries({ queryKey: assetKeys.all.toKey() });
                showBubble();
            }
        }
    });

    useInterval(() => runIntervalRefetch(), isFocused ? 3000 : null);

    const getItemType = useCallback((item: HistoryRowItem) => item.type, []);

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
        <View style={styles.container}>
            <Screen.List
                ref={listRef}
                contentContainerStyle={styles.contentContainer}
                data={rows}
                keyExtractor={item => item.key}
                getItemType={getItemType}
                drawDistance={600}
                onEndReached={fetchNextPage}
                onEndReachedThreshold={0.5}
                ItemSeparatorComponent={renderSeparator}
                renderItem={renderItem}
                onScroll={scrollHandler}
                scrollEventThrottle={50}
                maintainVisibleContentPosition={{ autoscrollToTopThreshold: 20 }}
            />
            <NewTransactionsBubble mode={bubbleMode} onPress={onBubblePress} />
        </View>
    );
};
