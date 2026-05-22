export enum GROUP_LABEL {
    PENDING = 'PENDING',
    TODAY = 'TODAY',
    YESTERDAY = 'YESTERDAY',
    THIS_MONTH = 'THIS_MONTH',
    THIS_YEAR = 'THIS_YEAR',
    PAST_YEAR = 'PAST_YEAR'
}

export type GroupMeta =
    | { label: GROUP_LABEL.TODAY }
    | { label: GROUP_LABEL.YESTERDAY }
    | { label: GROUP_LABEL.THIS_MONTH; year: number; month: number; day: number }
    | { label: GROUP_LABEL.THIS_YEAR; year: number; month: number }
    | { label: GROUP_LABEL.PAST_YEAR; year: number; month: number };

export interface DatedGroup<T> {
    key: string;
    meta: GroupMeta;
    items: T[];
}

export function getEventGroupMeta(timestamp: number, today: Date, yesterday: Date): GroupMeta {
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

// TODO: rewrite activity using shared groupByDate implementation
export function groupByDate<T>(items: T[], getTimestamp: (item: T) => number): DatedGroup<T>[] {
    if (items.length === 0) {
        return [];
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const sorted = [...items].sort((a, b) => getTimestamp(a) - getTimestamp(b));

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
