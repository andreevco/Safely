import type { ReactNode } from 'react';

import { Text as UIText } from '@mobile/shared/ui/Text';

import { styles } from './Text.styles';
import { useBannerContext } from '../../BannerContext';

type Props = {
    children: ReactNode;
};

export const Text = ({ children }: Props) => {
    const { variant } = useBannerContext();

    styles.useVariants({ variant });

    return (
        <UIText variant="bodyM" style={styles.text}>
            {children}
        </UIText>
    );
};
