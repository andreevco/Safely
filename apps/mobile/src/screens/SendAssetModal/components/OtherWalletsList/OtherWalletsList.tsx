import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';

import { List } from '@mobile/shared/ui';

import { WalletCell } from './components';
import { styles } from './OtherWalletsList.styles';

interface OtherWalletsListProps {
    suggestions: Portfolio[];
    onSelect: (address: string, label: string) => void;
}

export const OtherWalletsList = (props: OtherWalletsListProps) => {
    const { suggestions, onSelect } = props;

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
            <List style={styles.container}>
                <List.Group>
                    {suggestions.map(portfolio => (
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
