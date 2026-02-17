import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { useQrScan } from '@safely/ux';

import { Icon, QrCodeScan28, XmarkCircle16 } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './AddressInput.styles';

interface AddressInputProps {
    value: string;
    onChangeText: (value: string) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

export const AddressInput = (props: AddressInputProps) => {
    const { value, onChangeText, error, label, placeholder, autoFocus } = props;

    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const handleScan = useQrScan({
        allowedSchemes: ['btc-transfer'] as const,
        onResult: useCallback(
            scheme => {
                onChangeText(scheme.parsed.address);
            },
            [onChangeText]
        )
    });

    const [isFocused, setIsFocused] = useState(false);

    const hasValue = value.length > 0;
    const hasError = !!error;

    styles.useVariants({
        focused: isFocused && !hasError,
        error: hasError
    });

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    const handleClear = useCallback(() => {
        onChangeText('');
    }, [onChangeText]);

    return (
        <View>
            {label && (
                <View style={styles.labelContainer}>
                    <Text variant="bodyM" color="tertiary">
                        {label}
                    </Text>
                </View>
            )}
            <View style={styles.container}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoFocus={autoFocus}
                    multiline
                />

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={hasValue ? handleClear : handleScan}
                >
                    {hasValue ? (
                        <Icon icon={XmarkCircle16} color="tertiary" />
                    ) : (
                        <Icon icon={QrCodeScan28} size={24} color="accent" />
                    )}
                </TouchableOpacity>
            </View>

            {hasError && <Text style={styles.errorText}>{t(error)}</Text>}
        </View>
    );
};
