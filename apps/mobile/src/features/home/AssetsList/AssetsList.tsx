import { useHomeScreenList } from '@safely/ux';

import { AssetCell, AssetCellSkeleton } from '@mobile/entities/asset';
import { List } from '@mobile/shared/ui';

import { styles } from './AssetsList.styles';

export const AssetsList = () => {
    const { data } = useHomeScreenList() ?? [];

    if (!data) {
        return (
            <List>
                <List.Group style={styles.list}>
                    <AssetCellSkeleton />
                </List.Group>
            </List>
        );
    }

    const { topTokens } = data;
    return (
        <List>
            <List.Group style={styles.list}>
                {topTokens.map(token => (
                    <AssetCell
                        key={token.amount.asset.id.toString()}
                        cryptoAssetAmount={token.amount}
                        price={token.price ?? null}
                    />
                ))}
            </List.Group>
        </List>
    );
};
