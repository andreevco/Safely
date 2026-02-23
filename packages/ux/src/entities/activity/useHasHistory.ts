import { useHistory } from './useHistory';

export function useHasHistory() {
    return useHistory(
        {},
        {
            select(data) {
                return !!data?.pages?.some(p => p.items.length);
            }
        }
    );
}
