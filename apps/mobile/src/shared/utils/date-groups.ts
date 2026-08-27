import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { groupByDate } from '@safely/core';
import { getDateGroupTitle, useDateFormatter } from '@safely/ux';

export type GroupedRow<T> =
    | { key: string; type: 'header'; title: string }
    | { key: string; type: 'item'; item: T };

export const getGroupedRowType = <T>(row: GroupedRow<T>) => row.type;

export function useGroupedRows<T>(
    items: T[],
    getTimestamp: (item: T) => number,
    getItemKey: (item: T) => string
): GroupedRow<T>[] {
    const { t } = useTranslation();
    const formatter = useDateFormatter();

    return useMemo(
        () =>
            groupByDate(items, getTimestamp).flatMap(group => {
                const title = getDateGroupTitle(group.meta, t, formatter);
                return [
                    { key: `header-${group.key}`, type: 'header' as const, title },
                    ...group.items.map(item => ({
                        key: `item-${getItemKey(item)}`,
                        type: 'item' as const,
                        item
                    }))
                ];
            }),
        [items, getTimestamp, getItemKey, t, formatter]
    );
}
