import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type { IconProps } from '@mobile/shared/ui/Icon';
import { PasscodeInput } from '@mobile/shared/ui/PasscodeInput';
import { PasscodeKeypad } from '@mobile/shared/ui/PasscodeKeypad';
import { Text } from '@mobile/shared/ui/Text';

import { styles } from './PasscodeView.styles';

interface PasscodeViewProps {
    title: string;
    description?: string;
    numberOfDigits: number;
    value: string;
    onChange: (value: string) => void;
    isSuccess: SharedValue<boolean>;
    isError?: SharedValue<boolean>;
    biometry?: {
        onPress: () => void;
        icon: IconProps['icon'];
    };
    testID?: string;
}

export const PasscodeView = (props: PasscodeViewProps) => {
    const {
        title,
        description,
        numberOfDigits,
        value,
        onChange,
        isSuccess,
        isError,
        biometry,
        testID
    } = props;

    return (
        <View style={styles.content} testID={testID}>
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

            <PasscodeInput
                numberOfDigits={numberOfDigits}
                value={value}
                isSuccess={isSuccess}
                isError={isError}
            />

            <PasscodeKeypad
                value={value}
                onChange={onChange}
                maxLength={numberOfDigits}
                biometry={biometry}
            />
        </View>
    );
};
