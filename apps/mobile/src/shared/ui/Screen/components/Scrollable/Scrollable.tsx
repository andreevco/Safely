import { ScrollView, ScrollViewProps } from 'react-native';

import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';

import { styles } from './Scrollable.styles';

type ScrollableProps = ScrollViewProps;

export const Scrollable = (props: ScrollableProps) => {
    const { children, style, contentContainerStyle, ...rest } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            style={[styles.container, style]}
            contentContainerStyle={[
                styles.contentContainer({ shouldAddBottomInsets: !isInsideTabBar }),
                contentContainerStyle
            ]}
            {...rest}
        >
            {children}
        </ScrollView>
    );
};
