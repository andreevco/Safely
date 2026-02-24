import { FlashList, FlashListProps } from '@shopify/flash-list';
import { FlashListRef } from '@shopify/flash-list/dist/FlashListRef';
import React from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';

import { styles } from './List.styles';

export type ListRef<T> = FlashListRef<T>;

export const List = <TItem,>(
    props: FlashListProps<TItem> & { ref: React.Ref<FlashListRef<TItem>> }
) => {
    const { style, contentContainerStyle, ref, ...rest } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <FlashList
            ref={ref}
            style={StyleSheet.flatten([styles.container, style])}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={StyleSheet.flatten([
                styles.contentContainer({ shouldAddBottomInsets: !isInsideTabBar }),
                contentContainerStyle
            ])}
            {...rest}
        />
    );
};
