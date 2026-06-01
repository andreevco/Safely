import React from 'react';
import type { ScrollViewProps } from 'react-native';
import { ScrollView } from 'react-native';

import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';

import { styles } from './Scrollable.styles';

export type ScrollableRef = ScrollView;

type ScrollableProps = ScrollViewProps & { ref?: React.Ref<ScrollView> };

export const Scrollable = (props: ScrollableProps) => {
    const { children, style, contentContainerStyle, ref, ...rest } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <ScrollView
            ref={ref}
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
