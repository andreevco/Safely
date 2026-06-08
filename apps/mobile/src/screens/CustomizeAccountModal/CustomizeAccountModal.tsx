import type { ParamListBase, StaticScreenProps } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { Button, Icon, Screen, Text, Xmark16, XmarkCircle16 } from '@mobile/shared/ui';

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
    const isFocused = useSharedValue(false);
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    const [accountName, setAccountName] = useState(defaultName ?? '');

    useEffect(() => {
        const unsub = navigation.addListener('transitionEnd', event => {
            if (event.data.closing) {
                return;
            }
            inputRef.current?.focus();
        });
        return unsub;
    }, [navigation]);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        await onSave?.(accountName.trim());
    }, [onSave, accountName]);

    const isNameValid = accountName.trim().length > 0;

    const inputContainerAnimatedStyle = useAnimatedStyle(() => ({
        borderWidth: 1,
        borderColor: isFocused.value
            ? theme.colors.input.focused.border
            : theme.colors.input.background
    }));

    const iconButtonAnimatedStyle = useAnimatedStyle(
        () => ({
            opacity: withTiming(accountName.length ? 1 : 0, { duration: 50 })
        }),
        [accountName]
    );

    const handleClear = useCallback(() => {
        setAccountName('');
    }, [setAccountName]);

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

                    <Animated.View style={[styles.inputContainer, inputContainerAnimatedStyle]}>
                        <TextInput
                            onFocus={() => (isFocused.value = true)}
                            onBlur={() => (isFocused.value = false)}
                            ref={inputRef}
                            value={accountName}
                            onChangeText={setAccountName}
                            placeholder={t('customizeAccount.namePlaceholder')}
                            placeholderTextColor={theme.colors.text.tertiary}
                            style={styles.input}
                            autoCorrect={false}
                            maxLength={24}
                            returnKeyType="done"
                            onSubmitEditing={handleSave}
                        />
                        <Animated.View style={[iconButtonAnimatedStyle, styles.iconButton]}>
                            <TouchableOpacity hitSlop={16} onPress={handleClear}>
                                <Icon icon={XmarkCircle16} color="tertiary" />
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
                </View>
            </Screen.Content>
        </Screen>
    );
};
