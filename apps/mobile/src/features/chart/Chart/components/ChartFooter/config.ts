import { ChartPeriod } from '../../config';

type TickConfig = {
    tick: (index: number) => 'small' | 'medium' | 'large';
    mediumTickColor?: 'tertiary' | 'secondary';
    count: number;
};

export const TICK_CONFIG_BY_PERIOD: Record<ChartPeriod, TickConfig> = {
    [ChartPeriod.ONE_HOUR]: {
        tick: (index: number) => {
            if (index % 60 === 0) return 'large';
            if (index % 15 === 0) return 'medium';
            return 'small';
        },
        count: 121
    },
    [ChartPeriod.ONE_DAY]: {
        tick: (index: number) => {
            if (index % 24 === 0) return 'large';
            if (index % 6 === 0) return 'medium';
            return 'small';
        },
        count: 49
    },
    [ChartPeriod.ONE_WEEK]: {
        tick: (index: number) => {
            if (index % 14 === 0) return 'large';
            if (index % 2 === 0) return 'medium';
            return 'small';
        },
        count: 29
    },
    [ChartPeriod.ONE_MONTH]: {
        tick: (index: number) => {
            if (index % 30 === 0) return 'large';
            return 'small';
        },
        count: 61
    },
    [ChartPeriod.NINETY_DAYS]: {
        tick: (index: number) => {
            if (index % 3 === 0) return 'large';
            return 'medium';
        },
        mediumTickColor: 'tertiary',
        count: 7
    },
    [ChartPeriod.ONE_YEAR]: {
        tick: (index: number) => {
            if (index % 12 === 0) return 'large';
            return 'medium';
        },
        mediumTickColor: 'tertiary',
        count: 25
    },
    [ChartPeriod.ALL_TIME]: {
        tick: (_: number) => 'large',
        count: 1
    }
};
