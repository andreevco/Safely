import { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@mobile/shared/ui/Text';

import { styles } from './PasscodeLayout.styles';

interface PasscodeLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export const PasscodeLayout = (props: PasscodeLayoutProps) => {
    const { title, description, children } = props;

    return (
        <View style={styles.content}>
            <View style={styles.textContainer}>
                <Text textAlign="center" variant="titleM">
                    {title}
                </Text>

                {description && (
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {description}
                    </Text>
                )}
            </View>
            {children}
        </View>
    );
};
