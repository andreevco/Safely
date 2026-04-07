import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, View } from 'react-native';

import {
    useAccounts,
    useAppContext,
    useCreateAccount,
    useCreateExistingAccountConnector,
    useLoader,
    useToast
} from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { BottomSheet, Button, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './AddAccountSheet.styles';

const AddAccountContent = () => {
    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const { getSecureEncryptedStorage } = useAppContext();
    const navigation = useNavigation<RootStackNavigationProp>();
    const signIn = useCreateExistingAccountConnector();
    const accounts = useAccounts();
    const { mutateAsync: createAccount } = useCreateAccount({
        createWallet: true,
        setActive: true
    });
    const { withLoader } = useLoader();
    const toast = useToast();

    const shouldCloseOnFocus = useRef(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (shouldCloseOnFocus.current) {
                close();
            }
        });

        return unsubscribe;
    }, [navigation, close]);

    const handleCreateNew = () => {
        shouldCloseOnFocus.current = true;
        const defaultName = t('addAccount.defaultName', { number: (accounts?.length ?? 0) + 1 });
        navigation.navigate('CustomizeAccountModal', {
            defaultName,
            onSave: async (name: string) => {
                using secureEncryptedStorage = getSecureEncryptedStorage();
                await secureEncryptedStorage.unlock();

                Keyboard.dismiss();

                await withLoader(async () => {
                    await createAccount({ name, secureEncryptedStorage });
                });

                toast(t('addAccount.toastAccountCreated'));
                navigation.goBack();
            },
            onClose: () => {
                navigation.goBack();
            }
        });
    };

    const handleSignIn = useCallback(async () => {
        signIn.reset();

        const secureEncryptedStorage = getSecureEncryptedStorage();

        try {
            await secureEncryptedStorage.unlock();
            const connector = await signIn.mutateAsync({ secureEncryptedStorage });

            navigation.navigate('SignInModal', {
                connector,
                closeStorage: () => secureEncryptedStorage[Symbol.dispose]()
            });
        } catch {
            secureEncryptedStorage[Symbol.dispose]();
        }
    }, [signIn, navigation, getSecureEncryptedStorage]);

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('addAccount.title')}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary">
                    {t('addAccount.subtitle')}
                </Text>
            </View>
            <View style={styles.footer}>
                <Button type="primary" size="large" onPress={handleCreateNew}>
                    {t('addAccount.createNew')}
                </Button>
                <Button type="secondary" size="large" onPress={handleSignIn}>
                    {t('addAccount.signIn')}
                </Button>
            </View>
        </View>
    );
};

export const AddAccountSheet = () => {
    return (
        <BottomSheet shortHeader>
            <AddAccountContent />
        </BottomSheet>
    );
};
