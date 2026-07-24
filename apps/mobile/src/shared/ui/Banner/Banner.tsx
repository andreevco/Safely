import type { TouchableOpacityProps } from 'react-native';
import { View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Banner.styles';
import { BannerContext } from './BannerContext';

export type BannerContainerProps = UnistylesVariants<typeof styles> &
    TouchableOpacityProps & {
        nonInteractive?: boolean;
    };

export const BannerContainer = (props: BannerContainerProps) => {
    const { variant, style, children, nonInteractive = false, ...rest } = props;

    styles.useVariants({ variant });

    if (nonInteractive) {
        return (
            <BannerContext.Provider value={{ variant }}>
                <View style={[styles.container, style]}>{children}</View>
            </BannerContext.Provider>
        );
    }

    return (
        <BannerContext.Provider value={{ variant }}>
            <TouchableOpacity style={[styles.container, style]} {...rest}>
                {children}
            </TouchableOpacity>
        </BannerContext.Provider>
    );
};
