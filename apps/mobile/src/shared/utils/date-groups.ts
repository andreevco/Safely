import { type TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { GROUP_LABEL, groupByDate, type GroupMeta } from '@safely/core';
import { DateFormatter, useDateFormatter } from '@safely/ux';

export const getGroupKey = (meta: GroupMeta): string => JSON.stringify(meta);

export const getDateGroupTitle = (
    meta: GroupMeta,
    t: TFunction,
    formatter: DateFormatter
): string => {
    switch (meta.label) {
        case GROUP_LABEL.TODAY:
            return t('dateGroups.today');
        case GROUP_LABEL.YESTERDAY:
            return t('dateGroups.yesterday');
        case GROUP_LABEL.THIS_MONTH: {
            const date = new Date(meta.year, meta.month, meta.day);
            return formatter({ month: 'long', day: 'numeric' }).format(date);
        }
        case GROUP_LABEL.THIS_YEAR: {
            const date = new Date(meta.year, meta.month, 1);
            return formatter({ month: 'long' }).format(date);
        }
        case GROUP_LABEL.PAST_YEAR: {
            const date = new Date(meta.year, meta.month, 1);
            return formatter({ month: 'long', year: 'numeric' }).format(date);
        }
    }
};

interface GroupedItems<T> {
    key: string;
    title: string;
    items: T[];
}

export function useGroupedItems<T>(
    items: T[],
    getTimestamp: (item: T) => number
): GroupedItems<T>[] {
    const { t } = useTranslation();
    const formatter = useDateFormatter();

    return useMemo(
        () =>
            groupByDate(items, getTimestamp).map(group => ({
                key: group.key,
                title: getDateGroupTitle(group.meta, t, formatter),
                items: group.items
            })),
        [items, getTimestamp, t, formatter]
    );
}
