import { useDerivedQuery } from '../../shared';
import { useActiveFiat } from '../fiat';
import { useAssets } from './useAssets';
import { calculateTotalBalance } from './utils';

export function useTotalBalance() {
    const assetsQuery = useAssets();
    const fiat = useActiveFiat();

    return useDerivedQuery({
        queries: [assetsQuery],
        queryFn([assets]) {
            return assets ?? [];
        },
        select(assets) {
            return calculateTotalBalance(assets, fiat);
        }
    });
}
