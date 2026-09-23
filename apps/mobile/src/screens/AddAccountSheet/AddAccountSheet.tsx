import { useNavigation } from '@react-navigation/core';
import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, View } from 'react-native';

import {
    useAppContext,
    useCreateAccount,
    useCreateExistingAccountConnector,
    useLoader,
    useNewAccountDefaultName,
    useToast
} from '@safely/ux';

import { BottomSheetScreen } from '@mobile/shared/navigation';
import { Button, Text, useCloseOnReturn } from '@mobile/shared/ui';

import { styles } from './AddAccountSheet.styles';

type AddAccountSheetParams = {
    onAccountAdded?: () => void;
};

type AddAccountSheetProps = StaticScreenProps<AddAccountSheetParams | undefined>;

const AddAccountContent = ({ onAccountAdded }: AddAccountSheetParams) => {
    const { t } = useTranslation();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const navigation = useNavigation();
    const signIn = useCreateExistingAccountConnector();
    const { mutateAsync: createAccount } = useCreateAccount({
        setActive: true
    });
    const { withLoader } = useLoader();
    const toast = useToast();
    const markNavigated = useCloseOnReturn();
    const defaultName = useNewAccountDefaultName();

    const handleCreateNew = () => {
        markNavigated();
        navigation.navigate('CustomizeAccountModal', {
            defaultName,
            onSave: async (name: string) => {
                using secureEncryptedStorage = getSecureEncrypted();
                await secureEncryptedStorage.unlock();

                Keyboard.dismiss();

                await withLoader(async () => {
                    await createAccount({
                        name,
                        secureEncryptedStorage,
                        firstPortfolio: { kind: 'generated' }
                    });
                });

                toast(t('addAccount.toastAccountCreated'));

                if (onAccountAdded) {
                    onAccountAdded();
                    return;
                }

                navigation.goBack();
            },
            onClose: () => {
                navigation.goBack();
            }
        });
    };

    const handleSignIn = useCallback(async () => {
        signIn.reset();

        const secureEncryptedStorage = getSecureEncrypted();

        try {
            await secureEncryptedStorage.unlock();
            const connector = await signIn.mutateAsync({ secureEncryptedStorage });

            markNavigated();
            navigation.navigate('SignInModal', {
                screen: 'SignInQRModal',
                params: {
                    connector,
                    closeStorage: () => secureEncryptedStorage[Symbol.dispose](),
                    onSuccess: (inviterIkPubHex: string | null) =>
                        navigation.navigate('SignInModal', {
                            screen: 'SignInSuccessModal',
                            params: {
                                inviterIkPubHex,
                                onContinue: () => (onAccountAdded ?? navigation.goBack)()
                            }
                        })
                }
            });
        } catch {
            secureEncryptedStorage[Symbol.dispose]();
        }
    }, [signIn, navigation, getSecureEncrypted, markNavigated, onAccountAdded]);

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

export const AddAccountSheet = (props: AddAccountSheetProps) => {
    return (
        <BottomSheetScreen shortHeader>
            <AddAccountContent onAccountAdded={props.route.params?.onAccountAdded} />
        </BottomSheetScreen>
    );
};
