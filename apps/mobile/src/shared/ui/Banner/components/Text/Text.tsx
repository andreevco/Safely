import type { TextProps } from '@mobile/shared/ui/Text';
import { Text as UIText } from '@mobile/shared/ui/Text';

import { styles } from './Text.styles';
import { useBannerContext } from '../../BannerContext';

type Props = TextProps;

export const Text = (props: Props) => {
    const { children, style, ...rest } = props;
    const { variant } = useBannerContext();

    styles.useVariants({ variant });

    return (
        <UIText variant="bodyM" style={[styles.text, style]} {...rest}>
            {children}
        </UIText>
    );
};
