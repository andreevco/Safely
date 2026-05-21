import type { StaticScreenProps } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet, Button, ConfirmCheckbox, Text, useBottomSheet } from '@mobile/shared/ui';

import { styles } from './SignOutAccountSheet.styles';
import type { AccountSyncState } from './useAccountSyncState';
import { useAccountSyncState } from './useAccountSyncState';

type SignOutAccountParams = {
    accountName: string;
    onConfirm: () => Promise<void>;
    onProtect: () => void;
};

type SignOutAccountSheetProps = StaticScreenProps<SignOutAccountParams>;

const needsCheckbox = (syncState: AccountSyncState) => syncState !== 'fullCopy';

const SignOutAccountContent = (props: SignOutAccountParams) => {
    const { accountName, onConfirm, onProtect } = props;

    const { t } = useTranslation();
    const { close } = useBottomSheet();
    const syncState = useAccountSyncState();

    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleSignOut = async () => {
        await onConfirm();
        close();
    };

    return (
        <View>
            <View style={styles.titleBox}>
                <Text textAlign="center" variant="titleM">
                    {t('settings.signOutAccount.sheet.title', { name: accountName })}
                </Text>
                <Text textAlign="center" variant="bodyL" color="secondary" style={styles.subtitle}>
                    {t(`settings.signOutAccount.sheet.${syncState}.subtitle`)}
                    {syncState === 'noDevices' && ' '}
                    {syncState === 'noDevices' && (
                        <Text variant="bodyL" color="link" onPress={onProtect}>
                            {t('settings.signOutAccount.sheet.noDevices.protectLink')}
                        </Text>
                    )}
                </Text>
            </View>

            {needsCheckbox(syncState) && (
                <ConfirmCheckbox
                    text={t(`settings.signOutAccount.sheet.${syncState}.checkbox`)}
                    isChecked={isConfirmed}
                    onToggle={() => setIsConfirmed(prev => !prev)}
                />
            )}

            <View style={styles.footer}>
                <Button
                    type="destructive"
                    size="large"
                    disabled={needsCheckbox(syncState) && !isConfirmed}
                    onPress={handleSignOut}
                >
                    {t('settings.signOutAccount.sheet.signOutButton')}
                </Button>
                <Button type="secondary" size="large" onPress={close}>
                    {t('settings.signOutAccount.sheet.cancelButton')}
                </Button>
            </View>
        </View>
    );
};

export const SignOutAccountSheet = (props: SignOutAccountSheetProps) => {
    return (
        <BottomSheet>
            <SignOutAccountContent {...props.route.params} />
        </BottomSheet>
    );
};
