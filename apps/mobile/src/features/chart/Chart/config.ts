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

export type ChartConfig = {
    startOfPeriod: (date: Date) => number;
    fullPeriodLength: number;
    getPeriodIndermediatePoints: (startDate: number) => number[];
};

export const CHART_CONFIG: Record<ChartPeriod, ChartConfig> = {
    [ChartPeriod.ONE_HOUR]: {
        startOfPeriod: startOfHour,
        fullPeriodLength: 1 * 60 * 60 * 1000,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [
                startDate,
                new Date(startDate + 1 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 2 * 60 * 60 * 1000).getTime()
            ];
        }
    },
    [ChartPeriod.ONE_DAY]: {
        startOfPeriod: startOfDay,
        fullPeriodLength: 24 * 60 * 60 * 1000,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [
                startDate,
                new Date(startDate + 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 48 * 60 * 60 * 1000).getTime()
            ];
        }
    },
    [ChartPeriod.ONE_WEEK]: {
        startOfPeriod: startOfWeek,
        fullPeriodLength: 7 * 24 * 60 * 60 * 1000,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [
                startDate,
                new Date(startDate + 7 * 24 * 60 * 60 * 1000).getTime(),
                new Date(startDate + 14 * 24 * 60 * 60 * 1000).getTime()
            ];
        }
    },
    [ChartPeriod.ONE_MONTH]: {
        startOfPeriod: startOfMonth,
        fullPeriodLength: 30 * 24 * 60 * 60 * 1000,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [
                startDate,
                addMonthsToTimestamp(startDate, 1),
                addMonthsToTimestamp(startDate, 2)
            ];
        }
    },
    [ChartPeriod.NINETY_DAYS]: {
        startOfPeriod: startOfMonth,
        fullPeriodLength: 90 * 24 * 60 * 60 * 1000,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [
                startDate,
                addMonthsToTimestamp(startDate, 3),
                addMonthsToTimestamp(startDate, 6)
            ];
        }
    },
    [ChartPeriod.ONE_YEAR]: {
        startOfPeriod: startOfYear,
        fullPeriodLength: 365 * 24 * 60 * 60 * 1000,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [
                startDate,
                addYearsToTimestamp(startDate, 1),
                addYearsToTimestamp(startDate, 2)
            ];
        }
    },
    [ChartPeriod.ALL_TIME]: {
        startOfPeriod: startOfYear,
        fullPeriodLength: Infinity,
        getPeriodIndermediatePoints: (startDate: number) => {
            return [startDate];
        }
    }
};
