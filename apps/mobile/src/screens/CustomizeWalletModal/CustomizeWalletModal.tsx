import { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';

import { Portfolio } from '@safely/core';
import { useChangePortfolioMeta } from '@safely/ux';

import { useLoader } from '@mobile/shared/providers/loader';
import { Button, Screen } from '@mobile/shared/ui';

import { WalletIcon } from './constants';
import { CustomizeWalletContent } from './CustomizeWalletContent';
import { styles } from './CustomizeWalletModal.styles';

type CustomizeWalletModalProps = StaticScreenProps<{
    portfolio: Portfolio;
    onSuccess?: () => void;
}>;

export const CustomizeWalletModal = (props: CustomizeWalletModalProps) => {
    const { portfolio, onSuccess } = props.route?.params ?? {};
    const { t } = useTranslation();
    const { withLoader } = useLoader();
    const { mutateAsync: changePortfolioMeta } = useChangePortfolioMeta();

    const [walletName, setWalletName] = useState(portfolio?.meta.name);
    const [selectedIcon, setSelectedIcon] = useState<WalletIcon>(portfolio?.meta.icon);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        await withLoader(
            async () =>
                await changePortfolioMeta({
                    portfolio,
                    meta: { name: walletName.trim(), icon: selectedIcon }
                })
        );
        onSuccess?.();
    }, [withLoader, onSuccess, changePortfolioMeta, portfolio, walletName, selectedIcon]);

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
