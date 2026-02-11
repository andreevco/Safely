import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';

import { useAddWalletFlow } from '@mobile/features/add-wallet';
import { Button, Screen } from '@mobile/shared/ui';

import { WalletIcon } from './constants';
import { CustomizeWalletContent } from './CustomizeWalletContent';
import { styles } from './CustomizeWalletModal.styles';

export const CustomizeWalletModal = () => {
    const { t } = useTranslation();
    const { onFinishCustomize } = useAddWalletFlow();

    const [walletName, setWalletName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<WalletIcon>({ type: 'emoji', value: '🙂' });

    const handleSave = useCallback(() => {
        Keyboard.dismiss();
        onFinishCustomize({
            name: walletName.trim(),
            icon: selectedIcon
        });
    }, [walletName, selectedIcon, onFinishCustomize]);

    const isNameValid = walletName.trim().length > 0;

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.BackButton />
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
                <CustomizeWalletContent
                    title={t('customizeWallet.title')}
                    description={t('customizeWallet.description')}
                    walletName={walletName}
                    onWalletNameChange={setWalletName}
                    selectedIcon={selectedIcon}
                    onIconChange={setSelectedIcon}
                />
            </Screen.Content>
        </Screen>
    );
};
