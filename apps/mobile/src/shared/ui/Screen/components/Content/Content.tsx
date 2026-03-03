import { View, ViewStyle } from 'react-native';

import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';

import { styles } from './Content.styles';

interface ContentProps {
    children: React.ReactNode;
    style?: ViewStyle;
    bottomInset?: boolean;
}

export const Content = (props: ContentProps) => {
    const { children, style, bottomInset = true } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <View
            style={[
                styles.container({ shouldAddBottomInsets: bottomInset && !isInsideTabBar }),
                style
            ]}
        >
            {children}
        </View>
    );
};
