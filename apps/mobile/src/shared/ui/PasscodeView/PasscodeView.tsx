import { View } from 'react-native';
import { SharedValue } from 'react-native-reanimated';

import { IconProps } from '@mobile/shared/ui/Icon';
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
    onBiometry?: () => void;
    biometryIcon?: IconProps['icon'];
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
        onBiometry,
        biometryIcon
    } = props;

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
                onBiometry={onBiometry}
                biometryIcon={biometryIcon}
            />
        </View>
    );
};
