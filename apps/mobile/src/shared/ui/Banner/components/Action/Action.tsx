import { ReactNode } from 'react';

import { ChevronRight16, Icon } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Action.styles';
import { useBannerContext } from '../../BannerContext';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
    children: ReactNode;
    onPress?: () => void;
};

export const Action = ({ children, onPress }: Props) => {
    const { variant } = useBannerContext();

    styles.useVariants({ variant });

    return (
        <TouchableOpacity
            disabled={!onPress}
            style={styles.container}
            onPress={onPress}
            hitSlop={HIT_SLOP}
        >
            <Text variant="labelM" style={styles.text}>
                {children}
            </Text>
            <Icon icon={ChevronRight16} style={styles.chevron} />
        </TouchableOpacity>
    );
};
