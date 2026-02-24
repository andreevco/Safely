export const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const diffInDays = (date: Date, baseDate: Date) =>
    Math.floor((startOfDay(baseDate) - startOfDay(date)) / (24 * 60 * 60 * 1000));

export const startOfHour = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();

export const startOfWeek = (date: Date) =>
    new Date(
        date.getFullYear(),
        date.getMonth(),
        // starts from Monday. TODO: We should get this setting from user's preferences in future.
        date.getDate() - ((date.getDay() + 6) % 7)
    ).getTime();

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth()).getTime();

export const startOfYear = (date: Date) => new Date(date.getFullYear(), 0).getTime();

export const addMonthsToTimestamp = (timestamp: number, monthsToAdd: number): number => {
    const nextDate = new Date(timestamp);
    nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
    return nextDate.getTime();
};

export const addYearsToTimestamp = (timestamp: number, yearsToAdd: number): number => {
    const nextDate = new Date(timestamp);
    nextDate.setFullYear(nextDate.getFullYear() + yearsToAdd);
    return nextDate.getTime();
};
