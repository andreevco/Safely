export const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const diffInDays = (date: Date, baseDate: Date) =>
    Math.floor(((startOfDay(baseDate) - startOfDay(date)) / 24) * 60 * 60 * 1000);

export const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
