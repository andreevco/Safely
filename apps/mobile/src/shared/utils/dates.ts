export const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const diffInDays = (date: Date, baseDate: Date) =>
    Math.floor(((startOfDay(baseDate) - startOfDay(date)) / 24) * 60 * 60 * 1000);
