import { useFocusEffect } from '@react-navigation/native';
import { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, TextInput, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { Button, Icon, Screen, Text, Xmark16 } from '@mobile/shared/ui';

import { styles } from './CustomizeAccountModal.styles';

type CustomizeAccountModalProps = StaticScreenProps<{
    defaultName: string;
    onSave: (name: string) => Promise<void> | void;
    onClose: () => void;
}>;

export const CustomizeAccountModal = (props: CustomizeAccountModalProps) => {
    const { defaultName, onSave, onClose } = props.route?.params ?? {};
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const inputRef = useRef<TextInput>(null);

    const [accountName, setAccountName] = useState(defaultName ?? '');

    useFocusEffect(
        useCallback(() => {
            inputRef.current?.focus();
        }, [])
    );

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        await onSave?.(accountName.trim());
    }, [onSave, accountName]);

    const isNameValid = accountName.trim().length > 0;

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Button onPress={onClose}>
                    <Icon icon={Xmark16} />
                </Screen.Header.Button>
                <Button
                    type="primary"
                    size="small"
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={!isNameValid}
                >
                    {t('customizeAccount.save')}
                </Button>
            </Screen.Header>
            <Screen.Content bottomInset={false}>
                <View style={styles.content}>
                    <View style={styles.textContainer}>
                        <Text textAlign="center" variant="titleM">
                            {t('customizeAccount.title')}
                        </Text>
                        <Text textAlign="center" variant="bodyL" color="secondary">
                            {t('customizeAccount.subtitle')}
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            value={accountName}
                            onChangeText={setAccountName}
                            placeholder={t('customizeAccount.namePlaceholder')}
                            placeholderTextColor={theme.colors.text.tertiary}
                            style={styles.input}
                            autoCorrect={false}
                            maxLength={64}
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                        />
                    </View>
                </View>
            </Screen.Content>
        </Screen>
    );
};
