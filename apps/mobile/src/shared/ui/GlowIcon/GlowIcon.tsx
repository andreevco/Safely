import { View } from 'react-native';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';

import type { IconProps } from '@mobile/shared/ui/Icon';
import { Icon } from '@mobile/shared/ui/Icon';

import { styles, GLOW_SIZE } from './GlowIcon.styles';

type GlowIconProps = {
    icon: IconProps['icon'];
    color: string;
};

export const GlowIcon = (props: GlowIconProps) => {
    const { icon, color } = props;

    return (
        <View style={styles.container}>
            <Svg style={styles.glow} width={GLOW_SIZE} height={GLOW_SIZE}>
                <Defs>
                    <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor={color} stopOpacity={0.4} />
                        <Stop offset="0.5" stopColor={color} stopOpacity={0.12} />
                        <Stop offset="1" stopColor={color} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                <Rect width={GLOW_SIZE} height={GLOW_SIZE} fill="url(#glow)" />
            </Svg>
            <Icon icon={icon} style={{ tintColor: color }} />
        </View>
    );
};
