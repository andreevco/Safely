import { useMemo } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useActivePortfolio, usePortfolios } from '@safely/ux';

import { List } from '@mobile/shared/ui';

import { WalletCell } from './components';
import { styles } from './OtherWalletsList.styles';

interface OtherWalletsListProps {
    onSelect: (address: string) => void;
}

export const OtherWalletsList = (props: OtherWalletsListProps) => {
    const { onSelect } = props;
    const portfolios = usePortfolios();
    const activePortfolio = useActivePortfolio();

    const otherPortfolios = useMemo(() => {
        return portfolios.filter(p => !p.id.isEq(activePortfolio.id));
    }, [portfolios, activePortfolio]);

    if (otherPortfolios.length === 0) {
        return null;
    }

    return (
        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
            <List style={styles.container}>
                <List.Group>
                    {otherPortfolios.map(portfolio => (
                        <WalletCell
                            key={portfolio.id.toString()}
                            portfolio={portfolio}
                            onSelect={onSelect}
                        />
                    ))}
                </List.Group>
            </List>
        </Animated.View>
    );
};
