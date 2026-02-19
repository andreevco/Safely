import { type TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { type BtcActivityItem } from '@safely/ux';
import {
    ACTIVITY_GROUP_LABEL,
    ActivityItemsDatedGroupMeta
} from '@safely/ux/entities/activity/types';
import { useGroupedHistory } from '@safely/ux/entities/activity/useGroupedHistory';

import { ActivityItem } from '@mobile/entities/activity';
import { ActivityItemTimeFormatDetails } from '@mobile/entities/activity/ActivityItem/ActivityItem';
import { Screen, Text } from '@mobile/shared/ui';

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

const getGroupTitle = (
    meta: ActivityItemsDatedGroupMeta,
    t: TFunction,
    language: string
): string => {
    switch (meta.label) {
        case ACTIVITY_GROUP_LABEL.TODAY:
            return t('history.dateHeaders.today');
        case ACTIVITY_GROUP_LABEL.YESTERDAY:
            return t('history.dateHeaders.yesterday');
        case ACTIVITY_GROUP_LABEL.THIS_YEAR: {
            const date = new Date(2000, meta.month, 1);

            const formatter = new Intl.DateTimeFormat(language, {
                month: 'long'
            });

            return formatter.format(date);
        }
        case ACTIVITY_GROUP_LABEL.PAST_YEAR: {
            const date = new Date(meta.year, meta.month, 1);

            const formatter = new Intl.DateTimeFormat(language, {
                month: 'long',
                year: 'numeric'
            });

            return formatter.format(date);
        }
    }
};

type HistoryListProps = {
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

const timeFormatDetailsMap: Record<ACTIVITY_GROUP_LABEL, ActivityItemTimeFormatDetails> = {
    [ACTIVITY_GROUP_LABEL.TODAY]: 'time',
    [ACTIVITY_GROUP_LABEL.YESTERDAY]: 'time',
    [ACTIVITY_GROUP_LABEL.THIS_YEAR]: 'time-month',
    [ACTIVITY_GROUP_LABEL.PAST_YEAR]: 'time-month-year'
};

export const HistoryList = (props: HistoryListProps) => {
    const { onNavigateToTransaction } = props;
    const { t, i18n } = useTranslation();

    const { theme } = useUnistyles();

    const { data: historyGroups, isRefetching, refetch, fetchNextPage } = useGroupedHistory();

    const rows = useMemo<HistoryRowItem[] | undefined>(() => {
        return historyGroups?.flatMap(item => {
            const { items: groupActivity, ...meta } = item;
            const groupKey = getGroupKey(meta);

            const header = {
                key: `header-${groupKey}`,
                type: 'header' as const,
                title: getGroupTitle(meta, t, i18n.language)
            };

            const activity = groupActivity.map(a => ({
                type: 'activity' as const,
                key: `activity-${groupKey}-${a.key}`,
                activity: a,
                timeFormatDetails: timeFormatDetailsMap[meta.label]
            }));
            return [header, ...activity];
        });
    }, [i18n.language, historyGroups, t]);

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
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    tintColor={theme.colors.text.secondary}
                />
            }
            data={rows}
            keyExtractor={item => item.key}
            onEndReached={fetchNextPage}
            onEndReachedThreshold={0.5}
            ItemSeparatorComponent={renderSeparator}
            renderItem={renderItem}
        />
    );
};
