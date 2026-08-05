import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { Banner, Bulb16, GlowIcon, Text } from '@mobile/shared/ui';

import { styles } from './WizardHint.styles';

type WizardHintProps = {
    title: string;
    description: string;
    children?: ReactNode;
};

export const WizardHint = (props: WizardHintProps) => {
    const { title, description, children } = props;

    const { theme } = useUnistyles();

    styles.useVariants({ hasAction: children !== undefined });

    return (
        <Banner nonInteractive style={styles.banner}>
            <View style={styles.icon}>
                <GlowIcon icon={Bulb16} color={theme.colors.wallet.orange} />
            </View>
            <View style={styles.text}>
                <Text variant="labelM">{title}</Text>
                <Text variant="bodyM" color="secondary">
                    {description}
                </Text>
            </View>
            {children !== undefined && <View style={styles.action}>{children}</View>}
        </Banner>
    );
};
