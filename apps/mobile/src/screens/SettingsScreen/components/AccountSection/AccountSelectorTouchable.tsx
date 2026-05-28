import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { Cell, Icon, List, Switch16 } from '@mobile/shared/ui';

import { AccountCell } from './AccountCell';

interface AccountSelectorTouchableProps {
    progress: SharedValue<number>;
    name: string;
    walletsCount: number;
}

export const AccountSelectorTouchable = (props: AccountSelectorTouchableProps) => {
    const { progress, name, walletsCount } = props;

    const animatedOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 1], [1, 0.56])
    }));

    return (
        <Animated.View style={animatedOpacity}>
            <View pointerEvents="none">
                <List.Group withoutBottomMargin>
                    <Cell>
                        <AccountCell name={name} walletsCount={walletsCount} />
                        <Icon icon={Switch16} color="tertiary" />
                    </Cell>
                </List.Group>
            </View>
        </Animated.View>
    );
};
