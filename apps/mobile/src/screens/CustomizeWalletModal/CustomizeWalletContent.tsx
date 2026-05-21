import { useFocusEffect } from '@react-navigation/native';
import { selectionAsync } from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useUnistyles } from 'react-native-unistyles';

import { ColorPicker, EmojiPicker, Text } from '@mobile/shared/ui';
import { smoothstepGradient } from '@mobile/shared/utils';

import type { WalletIcon } from './constants';
import { WALLET_COLORS, WALLET_EMOJIS } from './constants';
import { styles } from './CustomizeWalletContent.styles';

interface CustomizeWalletContentProps {
    title: string;
    description: string;
    walletName: string;
    onWalletNameChange: (value: string) => void;
    selectedIcon: WalletIcon;
    onIconChange: (icon: WalletIcon) => void;
    disabled?: boolean;
    onSubmitEditing?: () => void;
}

export const CustomizeWalletContent = ({
    title,
    description,
    walletName,
    onWalletNameChange,
    selectedIcon,
    onIconChange,
    disabled = false,
    onSubmitEditing
}: CustomizeWalletContentProps) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    styles.useVariants({ focused: isFocused });

    useFocusEffect(
        useCallback(() => {
            requestAnimationFrame(() => inputRef.current?.focus());
        }, [])
    );

    const handleIconChange = useCallback(
        (icon: WalletIcon) => {
            selectionAsync();
            onIconChange(icon);
        },
        [onIconChange]
    );

    const iconDisplay = useMemo(() => {
        if (selectedIcon.type === 'emoji') {
            return <Text style={styles.inputEmoji}>{selectedIcon.value}</Text>;
        }

        if (selectedIcon.type === 'color') {
            return <View style={[styles.colorDot, { backgroundColor: selectedIcon.value }]} />;
        }

        return null;
    }, [selectedIcon]);

    return (
        <>
            <View style={styles.content} pointerEvents={disabled ? 'none' : 'auto'}>
                <View style={styles.textContainer}>
                    <Text textAlign="center" variant="titleM">
                        {title}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {description}
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            value={walletName}
                            onChangeText={onWalletNameChange}
                            placeholder={t('customizeWallet.namePlaceholder')}
                            placeholderTextColor={theme.colors.text.tertiary}
                            style={[styles.input, { color: theme.colors.text.primary }]}
                            editable={!disabled}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            maxLength={24}
                            returnKeyType="done"
                            onSubmitEditing={onSubmitEditing}
                        />
                        {iconDisplay && <View style={styles.iconContainer}>{iconDisplay}</View>}
                    </View>
                </View>

                <KeyboardAwareScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <ColorPicker
                        colors={WALLET_COLORS}
                        selectedColor={
                            selectedIcon.type === 'color' ? selectedIcon.value : undefined
                        }
                        onColorSelect={color => handleIconChange({ type: 'color', value: color })}
                    />

                    <EmojiPicker
                        emojis={WALLET_EMOJIS}
                        onEmojiSelect={emoji => handleIconChange({ type: 'emoji', value: emoji })}
                    />
                </KeyboardAwareScrollView>
            </View>
            <KeyboardStickyView pointerEvents="none">
                <LinearGradient
                    style={styles.gradient}
                    colors={smoothstepGradient(theme.colors.background.primary)}
                />
            </KeyboardStickyView>
        </>
    );
};
