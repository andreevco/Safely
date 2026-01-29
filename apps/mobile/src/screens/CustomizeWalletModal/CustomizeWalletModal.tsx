import { Button, ColorPicker, EmojiPicker, Screen, Text } from '@mobile/shared/ui';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { WALLET_COLORS, WALLET_EMOJIS, WalletIcon } from './constants';
import { styles } from './CustomizeWalletModal.styles';

export const CustomizeWalletModal = () => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const navigation = useNavigation();

    const [walletName, setWalletName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<WalletIcon>({ type: 'emoji', value: '🙂' });

    const handleSave = useCallback(() => {
        // TODO: Implement save logic
        navigation.goBack();
    }, [navigation]);

    const isNameValid = walletName.trim().length > 0;

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
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.CloseButton />
                <Button
                    type="primary"
                    size="small"
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={!isNameValid}
                >
                    {t('customizeWallet.save')}
                </Button>
            </Screen.Header>
            <Screen.Content>
                <View style={styles.content}>
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleL">
                            {t('customizeWallet.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('customizeWallet.description')}
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                value={walletName}
                                onChangeText={setWalletName}
                                placeholder={t('customizeWallet.namePlaceholder')}
                                placeholderTextColor={theme.colors.text.tertiary}
                                style={[styles.input, { color: theme.colors.text.primary }]}
                            />
                            {iconDisplay && <View style={styles.iconContainer}>{iconDisplay}</View>}
                        </View>
                    </View>

                    <ColorPicker
                        colors={WALLET_COLORS}
                        selectedColor={
                            selectedIcon.type === 'color' ? selectedIcon.value : undefined
                        }
                        onColorSelect={color => setSelectedIcon({ type: 'color', value: color })}
                    />

                    <EmojiPicker
                        emojis={WALLET_EMOJIS}
                        onEmojiSelect={emoji => setSelectedIcon({ type: 'emoji', value: emoji })}
                    />
                </View>
            </Screen.Content>
        </Screen>
    );
};
