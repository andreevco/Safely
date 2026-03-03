import { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';

import { Portfolio } from '@safely/core';
import { useChangePortfolioMeta } from '@safely/ux';

import { Button, Icon, Screen, Xmark16 } from '@mobile/shared/ui';

import { WalletIcon } from './constants';
import { CustomizeWalletContent } from './CustomizeWalletContent';
import { styles } from './CustomizeWalletModal.styles';

type CustomizeWalletModalProps = StaticScreenProps<{
    portfolio: Portfolio;
    // NOTE: this callback is for navigation actions only and calling in cases when user don't save changes
    onCompleteCustomize?: () => void;
}>;

export const CustomizeWalletModal = (props: CustomizeWalletModalProps) => {
    const { portfolio, onCompleteCustomize } = props.route?.params ?? {};
    const { t } = useTranslation();
    const { mutateAsync: changePortfolioMeta } = useChangePortfolioMeta();

    const [walletName, setWalletName] = useState(portfolio?.meta.name);
    const [selectedIcon, setSelectedIcon] = useState<WalletIcon>(portfolio?.meta.icon);

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        await changePortfolioMeta({
            portfolio,
            meta: { name: walletName.trim(), icon: selectedIcon }
        });
        onCompleteCustomize?.();
    }, [onCompleteCustomize, changePortfolioMeta, portfolio, walletName, selectedIcon]);

    const isNameValid = walletName.trim().length > 0;

    return (
        <Screen>
            <Screen.Header variant="left">
                <Screen.Header.Button onPress={onCompleteCustomize}>
                    <Icon icon={Xmark16} />
                </Screen.Header.Button>
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
            <Screen.Content bottomInset={false}>
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
