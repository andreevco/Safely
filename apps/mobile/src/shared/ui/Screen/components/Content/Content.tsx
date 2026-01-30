import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';
import { View, ViewStyle } from 'react-native';

import { styles } from './Content.styles';

interface ContentProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const Content = (props: ContentProps) => {
    const { children, style } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <View style={[styles.container({ shouldAddBottomInsets: !isInsideTabBar }), style]}>
            {children}
        </View>
    );
};
