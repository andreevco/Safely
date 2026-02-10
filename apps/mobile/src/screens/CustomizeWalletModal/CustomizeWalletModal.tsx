import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { Portfolio } from '@safely/core';
import { useChangePortfolioMeta } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Button, ColorPicker, EmojiPicker, Screen, Text } from '@mobile/shared/ui';

import { WALLET_COLORS, WALLET_EMOJIS, WalletIcon } from './constants';
import { styles } from './CustomizeWalletModal.styles';

type CustomizeWalletModalProps = StaticScreenProps<{
    portfolio: Portfolio;
    onSaveEnd?: () => void;
}>;

export const CustomizeWalletModal = (props: CustomizeWalletModalProps) => {
    const { portfolio, onSaveEnd } = props.route.params;
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const navigation = useNavigation<RootStackNavigationProp<'CustomizeWalletModal'>>();
    const { mutate: changePortfolioMeta } = useChangePortfolioMeta();

    const [walletName, setWalletName] = useState(portfolio.meta.name);
    const [selectedIcon, setSelectedIcon] = useState<WalletIcon>(portfolio.meta.icon);

    const handleSave = useCallback(() => {
        changePortfolioMeta({
            portfolio: { id: portfolio.id },
            meta: { name: walletName, icon: selectedIcon }
        });
        onSaveEnd?.();
        navigation.goBack();
    }, [navigation, changePortfolioMeta, portfolio, walletName, selectedIcon, onSaveEnd]);

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
