import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';
import { View } from 'react-native';

import { styles } from './Content.styles';

interface ContentProps {
    children: React.ReactNode;
}

export const Content = (props: ContentProps) => {
    const { children } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <View style={styles.container({ shouldAddBottomInsets: !isInsideTabBar })}>{children}</View>
    );
};
