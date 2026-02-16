export function ellipsisMiddle(string: string, sideChars?: number): string;
export function ellipsisMiddle(string: undefined, sideChar?: number): undefined;
export function ellipsisMiddle(string: string | undefined, sideChars = 4) {
    if (!string) {
        return;
    }
    if (string.length <= sideChars * 2) {
        return string;
    }
    return string.slice(0, sideChars) + '…' + string.slice(-sideChars);
}
