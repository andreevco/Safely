import {
    startOfDay,
    startOfHour,
    startOfMonth,
    startOfWeek,
    startOfYear,
    addMonthsToTimestamp,
    addYearsToTimestamp
} from '@mobile/shared/utils/dates';

export enum ChartPeriod {
    ONE_HOUR = '1h',
    ONE_DAY = '24h',
    ONE_WEEK = '7d',
    ONE_MONTH = '30d',
    NINETY_DAYS = '90d',
    ONE_YEAR = '12m',
    ALL_TIME = 'all'
}

type TickConfig = {
    tick: (index: number) => 'small' | 'medium' | 'large';
    mediumTickColor?: 'tertiary' | 'secondary';
    count: number;
};

export type ChartConfig = {
    startOfPeriod: (date: Date) => number;
    fullPeriodLength: number;
    getPeriodIntermediatePoints: (startDate: number) => number[];
    tickConfig: TickConfig;
    crosshairDateFormat: Intl.DateTimeFormatOptions;
    footerDateFormat: Intl.DateTimeFormatOptions;
};

export const CHART_CONFIG: Record<ChartPeriod, ChartConfig> = {
    [ChartPeriod.ONE_HOUR]: {
        startOfPeriod: startOfHour,
        fullPeriodLength: 1 * 60 * 60 * 1000,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [
                startDate,
                new Date(startDate + 1 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 2 * 60 * 60 * 1000).getTime()
            ];
        },
        tickConfig: {
            tick: (index: number) => {
                if (index % 60 === 0) return 'large';
                if (index % 15 === 0) return 'medium';
                return 'small';
            },
            count: 121
        },
        crosshairDateFormat: { hour: '2-digit', minute: '2-digit' },
        footerDateFormat: { hour: '2-digit', minute: '2-digit' }
    },
    [ChartPeriod.ONE_DAY]: {
        startOfPeriod: startOfDay,
        fullPeriodLength: 24 * 60 * 60 * 1000,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [
                startDate,
                new Date(startDate + 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 48 * 60 * 60 * 1000).getTime()
            ];
        },
        tickConfig: {
            tick: (index: number) => {
                if (index % 24 === 0) return 'large';
                if (index % 6 === 0) return 'medium';
                return 'small';
            },
            count: 49
        },
        crosshairDateFormat: { hour: '2-digit', minute: '2-digit' },
        footerDateFormat: { month: 'short', day: 'numeric' }
    },
    [ChartPeriod.ONE_WEEK]: {
        startOfPeriod: () => startOfWeek(new Date(Date.now())),
        fullPeriodLength: 7 * 24 * 60 * 60 * 1000,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [
                startDate,
                new Date(startDate + 1 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 2 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 3 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 4 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 5 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 6 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 7 * 24 * 60 * 60 * 1000).getTime()
            ];
        },
        tickConfig: {
            tick: (index: number) => {
                if (index % 2 === 0) return 'large';
                return 'small';
            },
            count: 15
        },
        crosshairDateFormat: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        footerDateFormat: { weekday: 'short' }
    },
    [ChartPeriod.ONE_MONTH]: {
        startOfPeriod: startOfMonth,
        fullPeriodLength: 30 * 24 * 60 * 60 * 1000,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [
                startDate,
                addMonthsToTimestamp(startDate, 1),
                addMonthsToTimestamp(startDate, 2)
            ];
        },
        tickConfig: {
            tick: (index: number) => {
                if (index % 30 === 0) return 'large';
                return 'small';
            },
            count: 61
        },
        crosshairDateFormat: { month: 'short', day: 'numeric' },
        footerDateFormat: { month: 'short' }
    },
    [ChartPeriod.NINETY_DAYS]: {
        startOfPeriod: startOfMonth,
        fullPeriodLength: 90 * 24 * 60 * 60 * 1000,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [
                startDate,
                addMonthsToTimestamp(startDate, 1),
                addMonthsToTimestamp(startDate, 2),
                addMonthsToTimestamp(startDate, 3),
                addMonthsToTimestamp(startDate, 4)
            ];
        },
        tickConfig: {
            tick: (index: number) => {
                if (index % 29 === 0) return 'large';
                return 'small';
            },
            mediumTickColor: 'tertiary',
            // TODO: ask Techies should represent real days or pofig i tak soidet?
            count: 117
        },
        crosshairDateFormat: { month: 'short', day: 'numeric' },
        footerDateFormat: { month: 'short' }
    },
    [ChartPeriod.ONE_YEAR]: {
        startOfPeriod: startOfYear,
        fullPeriodLength: 365 * 24 * 60 * 60 * 1000,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [
                startDate,
                addYearsToTimestamp(startDate, 1),
                addYearsToTimestamp(startDate, 2)
            ];
        },
        tickConfig: {
            tick: (index: number) => {
                if (index % 12 === 0) return 'large';
                return 'medium';
            },
            mediumTickColor: 'tertiary',
            count: 25
        },
        crosshairDateFormat: { month: 'short', year: 'numeric' },
        footerDateFormat: { year: 'numeric' }
    },
    [ChartPeriod.ALL_TIME]: {
        startOfPeriod: startOfYear,
        fullPeriodLength: Infinity,
        getPeriodIntermediatePoints: (startDate: number) => {
            return [startDate];
        },
        tickConfig: {
            tick: (_: number) => 'large',
            count: 1
        },
        crosshairDateFormat: { month: 'short', year: 'numeric' },
        footerDateFormat: { year: 'numeric' }
    }
};
