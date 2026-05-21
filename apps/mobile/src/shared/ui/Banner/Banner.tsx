import { TouchableOpacityProps } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Banner.styles';
import { BannerContext } from './BannerContext';

export type BannerContainerProps = UnistylesVariants<typeof styles> & TouchableOpacityProps;

export const BannerContainer = (props: BannerContainerProps) => {
    const { variant, onPress, style, children, ...rest } = props;

    styles.useVariants({ variant });

    return (
        <BannerContext.Provider value={{ variant }}>
            <TouchableOpacity style={[styles.container, style]} onPress={onPress} {...rest}>
                {children}
            </TouchableOpacity>
        </BannerContext.Provider>
    );
};
