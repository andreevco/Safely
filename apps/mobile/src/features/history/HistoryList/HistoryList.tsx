import { useIsFocused, useScrollToTop } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { BTC_ASSET } from '@safely/core';
import {
    type ActivityItemsDatedGroup,
    type BtcActivityItem,
    assetKeys,
    useActualBtcBlockNumber,
    useContacts,
    useDateFormatter,
    useGroupedHistory,
    useInterval,
    useNumberFormatter,
    usePortfolios,
    useRate
} from '@safely/ux';

import { ActivityItem } from '@mobile/entities/activity';
import { Screen, Text } from '@mobile/shared/ui';
import { ListRef } from '@mobile/shared/ui/Screen/components/List';

import { HistoryEmptyPlaceholder } from '../HistoryEmptyPlaceholder';
import { NewTransactionsBubble, useNewTransactionsBubble } from './components';
import { styles } from './HistoryList.styles';
import { useScrollToTopOnNewBroadcastedTx } from './hooks';
import {
    type ActivityRowContext,
    type HistoryRowItem,
    buildActivityRow,
    buildHeaderRow,
    getGroupKey,
    timeFormatDetailsByGroupLabel
} from './utils/rows';

const TIME_FORMAT_OPTIONS = { hour: 'numeric', minute: 'numeric' } as const;
const DAY_MONTH_FORMAT_OPTIONS = { day: 'numeric', month: 'short' } as const;

const getFirstActivityKey = (groups: ActivityItemsDatedGroup[] | undefined): string | undefined =>
    groups?.[0]?.items?.[0]?.key;
type HistoryListProps = {
    onNavigateToTransaction: (activity: BtcActivityItem) => void;
};

export const HistoryList = (props: HistoryListProps) => {
    const { onNavigateToTransaction } = props;
    const { t } = useTranslation();

    const groupFormatter = useDateFormatter();
    const dateFormatterTime = useDateFormatter(TIME_FORMAT_OPTIONS);
    const dateFormatterDayMonth = useDateFormatter(DAY_MONTH_FORMAT_OPTIONS);
    const numberFormatter = useNumberFormatter();
    const portfolios = usePortfolios();
    const contacts = useContacts();
    const { data: rateData } = useRate(BTC_ASSET);
    const { data: currentBlockNumber } = useActualBtcBlockNumber();

    const isFocused = useIsFocused();
    const listRef = useRef<ListRef<HistoryRowItem>>(null);
    const { data: historyGroups, refetch, fetchNextPage } = useGroupedHistory();
    const client = useQueryClient();
    const windowHeight = useWindowDimensions().height;

    useScrollToTop(listRef);
    useScrollToTopOnNewBroadcastedTx(listRef);

    const {
        scrollHandler,
        mode: bubbleMode,
        onPress: onBubblePress,
        show: showBubble
    } = useNewTransactionsBubble({
        listRef,
        topThreshold: windowHeight * 0.2
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
        if (!historyGroups) {
            return undefined;
        }

        const context: ActivityRowContext = {
            t,
            dateFormatterTime,
            dateFormatterDayMonth,
            numberFormatter,
            portfolios,
            contacts,
            rateData,
            currentBlockNumber,
            onNavigateToTransaction
        };

        return historyGroups.flatMap(group => {
            const { items: groupActivities, ...meta } = group;
            const groupKey = getGroupKey(meta);
            const timeFormatDetails = timeFormatDetailsByGroupLabel[meta.label];

            const header = buildHeaderRow(meta, groupKey, t, groupFormatter);
            const activityRows = groupActivities.map(activity =>
                buildActivityRow(activity, groupKey, timeFormatDetails, context)
            );

            return [header, ...activityRows];
        });
    }, [
        historyGroups,
        t,
        groupFormatter,
        dateFormatterTime,
        dateFormatterDayMonth,
        numberFormatter,
        rateData,
        portfolios,
        contacts,
        currentBlockNumber,
        onNavigateToTransaction
    ]);

    const renderSeparator = useCallback(() => {
        return <View style={styles.separator} />;
    }, []);

    const renderItem = useCallback(({ item, index }: { item: HistoryRowItem; index: number }) => {
        const { key: _, ...itemWithoutKey } = item;
        switch (itemWithoutKey.type) {
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
                return <ActivityItem {...itemWithoutKey} />;
        }
    }, []);

    if (!rows) {
        return null;
    }

    if (rows.length === 0) {
        return <HistoryEmptyPlaceholder />;
    }

    return (
        <View style={styles.container}>
            <Screen.List
                ref={listRef}
                contentContainerStyle={styles.contentContainer}
                data={rows}
                keyExtractor={item => item.key}
                getItemType={getItemType}
                drawDistance={windowHeight * 4}
                onEndReached={fetchNextPage}
                onEndReachedThreshold={0.5}
                ItemSeparatorComponent={renderSeparator}
                renderItem={renderItem}
                onScroll={scrollHandler}
                scrollEventThrottle={50}
            />
            <NewTransactionsBubble mode={bubbleMode} onPress={onBubblePress} />
        </View>
    );
};
