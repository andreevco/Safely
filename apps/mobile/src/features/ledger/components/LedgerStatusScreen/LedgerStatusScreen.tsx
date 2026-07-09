import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ArrowLeft16, Button, Icon, Screen, Text } from '@mobile/shared/ui';

import { styles } from './LedgerStatusScreen.styles';

interface LedgerStatusScreenProps {
    media: ReactNode;
    title: string;
    subtitle: string;
    buttonLabel: string;
    onButtonPress?: () => void;
    isButtonDisabled?: boolean;
    onBackPress?: () => void;
}

export const LedgerStatusScreen = (props: LedgerStatusScreenProps) => {
    const { media, title, subtitle, buttonLabel, onButtonPress, isButtonDisabled, onBackPress } =
        props;

    return (
        <Screen>
            <Screen.Header variant="left">
                {onBackPress && (
                    <Screen.Header.Button onPress={onBackPress}>
                        <Icon icon={ArrowLeft16} />
                    </Screen.Header.Button>
                )}
            </Screen.Header>
            <Screen.Content style={styles.content}>
                <View style={styles.body}>
                    {media}
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {title}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {subtitle}
                        </Text>
                    </View>
                </View>

                <Button
                    type="primary"
                    size="large"
                    style={styles.button}
                    onPress={onButtonPress}
                    disabled={isButtonDisabled}
                >
                    {buttonLabel}
                </Button>
            </Screen.Content>
        </Screen>
    );
};
