export enum GROUP_LABEL {
    PENDING = 'PENDING',
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY',
    THIS_MONTH = 'THIS_MONTH',
    THIS_YEAR = 'THIS_YEAR',
    PAST_YEAR = 'PAST_YEAR'
}

export type DateGroupMeta =
    | { label: GROUP_LABEL.TODAY }
    | { label: GROUP_LABEL.YESTERDAY }
    | { label: GROUP_LABEL.THIS_MONTH; year: number; month: number; day: number }
    | { label: GROUP_LABEL.THIS_YEAR; year: number; month: number }
    | { label: GROUP_LABEL.PAST_YEAR; year: number; month: number };

export type PendingGroupMeta = { label: GROUP_LABEL.PENDING };

export interface DatedGroup<T, M = DateGroupMeta> {
    key: string;
    meta: M;
    items: T[];
}

export interface GroupByDateOptions {
    order?: 'asc' | 'desc';
}

export interface GroupByDateWithPendingOptions<T> extends GroupByDateOptions {
    getIsPending: (item: T) => boolean;
}

function sortByTimestamp<T>(
    items: T[],
    getTimestamp: (item: T) => number,
    order: 'asc' | 'desc'
): T[] {
    return [...items].sort((a, b) =>
        order === 'asc' ? getTimestamp(a) - getTimestamp(b) : getTimestamp(b) - getTimestamp(a)
    );
}

export function getEventGroupMeta(timestamp: number, today: Date, yesterday: Date): DateGroupMeta {
    const date = new Date(timestamp);

    if (today.toDateString() === date.toDateString()) {
        return { label: GROUP_LABEL.TODAY };
    }

    if (yesterday.toDateString() === date.toDateString()) {
        return { label: GROUP_LABEL.YESTERDAY };
    }

    if (today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
        return {
            label: GROUP_LABEL.THIS_MONTH,
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate()
        };
    }

    if (today.getFullYear() === date.getFullYear()) {
        return {
            label: GROUP_LABEL.THIS_YEAR,
            year: date.getFullYear(),
            month: date.getMonth()
        };
    }

    return {
        label: GROUP_LABEL.PAST_YEAR,
        month: date.getMonth(),
        year: date.getFullYear()
    };
}

export function groupByDate<T>(
    items: T[],
    getTimestamp: (item: T) => number,
    options: GroupByDateOptions = {}
): DatedGroup<T>[] {
    if (items.length === 0) {
        return [];
    }

    const { order = 'asc' } = options;

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const sorted = sortByTimestamp(items, getTimestamp, order);

    const groups: DatedGroup<T>[] = [];
    const indexByKey = new Map<string, number>();

    for (const item of sorted) {
        const meta = getEventGroupMeta(getTimestamp(item), today, yesterday);
        const key = JSON.stringify(meta);
        const existing = indexByKey.get(key);

        if (existing !== undefined) {
            groups[existing].items.push(item);
        } else {
            indexByKey.set(key, groups.length);
            groups.push({ key, meta, items: [item] });
        }
    }

    return groups;
}

export function groupByDateWithPending<T>(
    items: T[],
    getTimestamp: (item: T) => number,
    options: GroupByDateWithPendingOptions<T>
): DatedGroup<T, DateGroupMeta | PendingGroupMeta>[] {
    const { getIsPending, ...dateOptions } = options;

    const pendingItems = items.filter(getIsPending);
    const datedGroups = groupByDate(
        items.filter(item => !getIsPending(item)),
        getTimestamp,
        dateOptions
    );

    if (pendingItems.length === 0) {
        return datedGroups;
    }

    const meta: PendingGroupMeta = { label: GROUP_LABEL.PENDING };
    const sortedPending = sortByTimestamp(pendingItems, getTimestamp, dateOptions.order ?? 'asc');

    return [{ key: JSON.stringify(meta), meta, items: sortedPending }, ...datedGroups];
}
