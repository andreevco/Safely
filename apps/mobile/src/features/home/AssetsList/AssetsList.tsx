import { useNavigation } from '@react-navigation/native';

import { useHomeScreenList } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { AssetCell, AssetCellSkeleton } from '@mobile/entities/asset';
import { List } from '@mobile/shared/ui';

import { styles } from './AssetsList.styles';

export const AssetsList = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
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
                        onPress={() => {
                            void navigation.navigate('ReceiveAssetModal', {
                                asset: token.amount.asset
                            });
                        }}
                        key={token.amount.asset.id.toString()}
                        cryptoAssetAmount={token.amount}
                        price={token.price ?? null}
                    />
                ))}
            </List.Group>
        </List>
    );
};
