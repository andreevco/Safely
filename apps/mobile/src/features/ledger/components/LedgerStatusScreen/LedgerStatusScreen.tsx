import { useNavigation } from '@react-navigation/core';
import { CommonActions } from '@react-navigation/native';
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
    hasBackButton?: boolean;
}

export const LedgerStatusScreen = (props: LedgerStatusScreenProps) => {
    const { media, title, subtitle, buttonLabel, onButtonPress, isButtonDisabled, hasBackButton } =
        props;
    const navigation = useNavigation();

    return (
        <Screen>
            <Screen.Header variant="left">
                {hasBackButton && (
                    <Screen.Header.Button
                        onPress={() =>
                            navigation.dispatch(CommonActions.navigate('AddWalletRootModal'))
                        }
                    >
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
