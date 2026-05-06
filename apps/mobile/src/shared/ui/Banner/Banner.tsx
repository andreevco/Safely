import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Banner.styles';
import { BannerContext } from './BannerContext';

export type BannerContainerProps = UnistylesVariants<typeof styles> & {
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
};

export const BannerContainer = (props: BannerContainerProps) => {
    const { variant, onPress, style, children } = props;

    styles.useVariants({ variant });

    return (
        <BannerContext.Provider value={{ variant }}>
            <TouchableOpacity
                style={[styles.container, style]}
                onPress={onPress}
                disabled={!onPress}
            >
                {children}
            </TouchableOpacity>
        </BannerContext.Provider>
    );
};
