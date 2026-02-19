import { useNavigation } from '@react-navigation/native';
import { Ref, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
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
    inputRef?: Ref<TextInput>;
}

export const AddressInput = (props: AddressInputProps) => {
    const { value, onChangeText, error, label, placeholder, inputRef } = props;

    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const navigation = useNavigation<RootStackNavigationProp>();
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

    const handleScan = useCallback(() => {
        navigation.navigate('QRScanModal', {
            onSuccess: (scannedValue: string) => {
                onChangeText(scannedValue);
            },
            onClose: () => {},
            title: t('home.actions.scan')
        });
    }, [navigation, onChangeText, t]);

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
                    ref={inputRef}
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
                    multiline
                />

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={hasValue ? handleClear : handleScan}
                >
                    {hasValue ? (
                        <Icon icon={XmarkCircle16} color="tertiary" />
                    ) : (
                        <Icon icon={QrCodeScan28} color="accent" />
                    )}
                </TouchableOpacity>
            </View>

            {hasError && <Text style={styles.errorText}>{t(error)}</Text>}
        </View>
    );
};
