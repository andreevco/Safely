import type { FC } from 'react';
import { useMemo } from 'react';

import { BTC_ASSET } from '@safely/core';
import type { ActivityItem } from '@safely/ux';
import {
    useActivePortfolioRate,
    useActualBtcBlockNumber,
    useContacts,
    useDateFormatter,
    useGroupedHistory,
    useNumberFormatter,
    usePortfolios,
    useShowFullSentAmount,
    useTranslate
} from '@safely/ux';

import { HistoryEmptyPlaceholder } from './HistoryEmptyPlaceholder';
import { groupStyles, listStyles, loaderStyles, sentinelStyles } from './HistoryList.styles';
import { buildHistoryGroups } from './rows';
import { ActivityItem as ActivityItemView, ActivityItemSkeleton } from '../../entities';
import { List, Skeleton, Spinner, useOnVisible } from '../../shared';

const TIME_FORMAT_OPTIONS = { hour: 'numeric', minute: 'numeric' } as const;
const DAY_MONTH_FORMAT_OPTIONS = { day: 'numeric', month: 'short' } as const;
const SKELETON_ROWS = [0, 1, 2];
const PREFETCH_MARGIN = '400px';

export type HistoryListProps = {
    onSelectActivity: (activity: ActivityItem) => void;
    onReceive: () => void;
};

export const HistoryList: FC<HistoryListProps> = props => {
    const { onSelectActivity, onReceive } = props;

    const t = useTranslate();
    const groupFormatter = useDateFormatter();
    const timeFormatter = useDateFormatter(TIME_FORMAT_OPTIONS);
    const dayMonthFormatter = useDateFormatter(DAY_MONTH_FORMAT_OPTIONS);
    const numberFormatter = useNumberFormatter();
    const portfolios = usePortfolios();
    const contacts = useContacts();
    const { data: rateData } = useActivePortfolioRate(BTC_ASSET);
    const { data: currentBlockNumber } = useActualBtcBlockNumber();
    const showFullSentAmount = useShowFullSentAmount();

    const {
        data: historyGroups,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useGroupedHistory();

    const groups = useMemo(() => {
        if (!historyGroups) {
            return undefined;
        }

        return buildHistoryGroups(historyGroups, {
            t,
            groupFormatter,
            timeFormatter,
            dayMonthFormatter,
            numberFormatter,
            portfolios,
            contacts,
            rateData,
            currentBlockNumber,
            showFullSentAmount,
            onSelectActivity
        });
    }, [
        historyGroups,
        t,
        groupFormatter,
        timeFormatter,
        dayMonthFormatter,
        numberFormatter,
        portfolios,
        contacts,
        rateData,
        currentBlockNumber,
        showFullSentAmount,
        onSelectActivity
    ]);

    const sentinelRef = useOnVisible(fetchNextPage, {
        isEnabled: hasNextPage && !isFetchingNextPage,
        rootMargin: PREFETCH_MARGIN
    });

    if (!groups) {
        return (
            <div className={listStyles}>
                <List>
                    <List.Title variant="heading">
                        <Skeleton width={72} height={20} />
                    </List.Title>
                    <List.Group variant="separated" className={groupStyles}>
                        {SKELETON_ROWS.map(row => (
                            <ActivityItemSkeleton key={row} />
                        ))}
                    </List.Group>
                </List>
            </div>
        );
    }

    if (groups.length === 0) {
        return <HistoryEmptyPlaceholder onReceive={onReceive} />;
    }

    return (
        <div className={listStyles}>
            {groups.map(group => (
                <List key={group.key}>
                    <List.Title variant="heading">{group.title}</List.Title>
                    <List.Group variant="separated" className={groupStyles}>
                        {group.rows.map(({ key, ...row }) => (
                            <ActivityItemView key={key} {...row} />
                        ))}
                    </List.Group>
                </List>
            ))}

            {hasNextPage && <div ref={sentinelRef} className={sentinelStyles} />}

            {isFetchingNextPage && (
                <div className={loaderStyles}>
                    <Spinner />
                </div>
            )}
        </div>
    );
};
