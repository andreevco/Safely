import { FlashList, FlashListProps } from '@shopify/flash-list';
import { StyleSheet } from 'react-native-unistyles';

import { useBottomTabBarHeightSafely } from '@mobile/shared/utils';

import { styles } from './List.styles';

export const List = <TItem,>(props: FlashListProps<TItem>) => {
    const { style, contentContainerStyle, ...rest } = props;
    const isInsideTabBar = !!useBottomTabBarHeightSafely();

    return (
        <FlashList
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
