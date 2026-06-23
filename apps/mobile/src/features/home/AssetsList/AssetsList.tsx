import { useNavigation } from '@react-navigation/core';

import { assertUnreachable, BLOCKCHAIN_NAME } from '@safely/core';
import { useHomeScreenList } from '@safely/ux';

import { BtcAssetCell, AssetCellSkeleton } from '@mobile/entities/asset';
import { List } from '@mobile/shared/ui';

import { styles } from './AssetsList.styles';

export const AssetsList = () => {
    const navigation = useNavigation();
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
                {topTokens.map(token =>
                    token.amount.asset.id.blockchain === BLOCKCHAIN_NAME.BTC ? (
                        <BtcAssetCell
                            onPress={() => {
                                void navigation.navigate('TabsNavigator', {
                                    screen: 'HomeStack',
                                    params: {
                                        screen: 'HistoryScreen'
                                    }
                                });
                            }}
                            key={token.amount.asset.id.toString()}
                            cryptoAssetAmount={token.amount}
                            price={token.price ?? null}
                        />
                    ) : (
                        assertUnreachable(token.amount.asset.id.blockchain)
                    )
                )}
            </List.Group>
        </List>
    );
};
