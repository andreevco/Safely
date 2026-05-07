import { Icon as UIIcon, IconProps } from '@mobile/shared/ui/Icon';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Icon.styles';
import { useBannerContext } from '../../BannerContext';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
    icon: IconProps['icon'];
    disabled?: boolean;
    onPress?: () => void;
};

export const Icon = ({ icon, disabled, onPress }: Props) => {
    const { variant } = useBannerContext();

    styles.useVariants({ variant });

    return (
        <TouchableOpacity disabled={disabled || !onPress} onPress={onPress} hitSlop={HIT_SLOP}>
            <UIIcon icon={icon} style={styles.icon} />
        </TouchableOpacity>
    );
};
