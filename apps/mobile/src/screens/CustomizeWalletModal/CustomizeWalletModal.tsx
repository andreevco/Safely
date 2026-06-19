import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';

import type { PortfolioMeta, PortfolioMetaIcon } from '@safely/core';

import { TEST_ID } from '@mobile/shared/constants';
import { Button, Icon, Screen, Xmark16 } from '@mobile/shared/ui';

import { CustomizeWalletContent } from './CustomizeWalletContent';
import { styles } from './CustomizeWalletModal.styles';

type CustomizeWalletModalProps = StaticScreenProps<{
    defaultIcon: PortfolioMetaIcon;
    defaultName: string;
    onSave: (meta: Pick<PortfolioMeta, 'icon' | 'name'>) => Promise<void>;
    onClose?: () => void;
    hasBackButton?: boolean;
    tag?: number;
}>;

export const CustomizeWalletModal = (props: CustomizeWalletModalProps) => {
    const { defaultIcon, defaultName, onSave, onClose, hasBackButton, tag } =
        props.route?.params ?? {};
    const { t } = useTranslation();

    const [walletName, setWalletName] = useState(defaultName);
    const [selectedIcon, setSelectedIcon] = useState<PortfolioMetaIcon>(defaultIcon);

    const handleSave = useCallback(() => {
        Keyboard.dismiss();

        void onSave({ name: walletName.trim(), icon: selectedIcon });
    }, [onSave, walletName, selectedIcon]);

    const isNameValid = walletName.trim().length > 0;

    return (
        <Screen>
            <Screen.Header variant="left">
                {hasBackButton ? (
                    <Screen.Header.BackButton />
                ) : onClose ? (
                    <Screen.Header.Button onPress={onClose}>
                        <Icon icon={Xmark16} />
                    </Screen.Header.Button>
                ) : null}
                <Button
                    testID={TEST_ID.customizeWallet.saveButton}
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
                    tag={tag}
                    onSubmitEditing={isNameValid ? handleSave : undefined}
                />
            </Screen.Content>
        </Screen>
    );
};
