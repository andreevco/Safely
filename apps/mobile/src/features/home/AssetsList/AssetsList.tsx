import { AssetCell } from '@mobile/entities/asset';
import { List } from '@mobile/shared/ui';

import { BTC_ASSET } from '@safely/core/entities/asset';

import { styles } from './AssetsList.styles';

export const AssetsList = () => {
    return (
        <List>
            <List.Group style={styles.list}>
                <AssetCell asset={BTC_ASSET} />
            </List.Group>
        </List>
    );
};
