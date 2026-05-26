import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { Platform, TextInput, View } from 'react-native';

import { TouchableOpacity } from '@mobile/shared/ui';
import { Backspace28, Icon, IconProps } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';

import { styles } from './PasscodeKeypad.styles';

const supportsHardwareKeyboard = Platform.OS === 'ios' && Platform.isPad;

interface PasscodeKeypadProps {
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    biometry?: {
        onPress: () => void;
        icon: IconProps['icon'];
    };
}

const DIGITS = '123456789'.split('');

export const PasscodeKeypad = (props: PasscodeKeypadProps) => {
    const { value, onChange, maxLength, biometry } = props;

    const inputRef = useRef<TextInput>(null);

    const refocus = () => {
        if (supportsHardwareKeyboard) inputRef.current?.focus();
    };

    const handleDigit = (digit: string) => {
        refocus();

        if (value.length >= maxLength) return;

        onChange(value + digit);
    };

    const handleBackspace = () => {
        refocus();

        if (value.length === 0) return;

        onChange(value.slice(0, -1));
    };

    const handleBiometry = () => {
        if (!biometry) return;

        void impactAsync(ImpactFeedbackStyle.Light);
        biometry.onPress();
    };

    const handleHardwareInput = (text: string) => {
        const digits = text.replace(/\D/g, '').slice(0, maxLength);
        onChange(digits);
    };

    return (
        <View style={styles.container}>
            {supportsHardwareKeyboard && (
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={handleHardwareInput}
                    keyboardType="number-pad"
                    autoFocus
                    caretHidden
                    showSoftInputOnFocus={false}
                    style={styles.hiddenInput}
                />
            )}
            {[0, 3, 6].map(start => (
                <View key={start} style={styles.row}>
                    {DIGITS.slice(start, start + 3).map(d => (
                        <TouchableOpacity
                            key={d}
                            style={styles.button}
                            onPress={() => handleDigit(d)}
                        >
                            <Text variant="titleL" color="primary" monospace>
                                {d}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            <View style={styles.row}>
                {biometry ? (
                    <TouchableOpacity style={styles.button} onPress={handleBiometry}>
                        <Icon icon={biometry.icon} size={28} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.button} />
                )}
                <TouchableOpacity style={styles.button} onPress={() => handleDigit('0')}>
                    <Text variant="titleL" color="primary" monospace>
                        0
                    </Text>
                </TouchableOpacity>
                {value.length > 0 ? (
                    <TouchableOpacity style={styles.button} onPress={handleBackspace}>
                        <Icon icon={Backspace28} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.button} />
                )}
            </View>
        </View>
    );
};
