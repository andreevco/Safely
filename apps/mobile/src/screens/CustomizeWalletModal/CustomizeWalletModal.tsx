import type { StaticScreenProps } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';

import type { Portfolio, PortfolioMeta, PortfolioMetaIcon } from '@safely/core';
import { allowedPortfolioMetaEmojis } from '@safely/core';
import { useChangePortfolioMeta, useNewPortfolioFallbackName } from '@safely/ux';

import { TEST_ID } from '@mobile/shared/constants';
import { Button, Icon, Screen, Xmark16 } from '@mobile/shared/ui';

import { CustomizeWalletContent } from './CustomizeWalletContent';
import { styles } from './CustomizeWalletModal.styles';

const getDefaultIcon = (): PortfolioMetaIcon => {
    const randomIndex = Math.floor(Math.random() * allowedPortfolioMetaEmojis.length);
    return { type: 'emoji', value: allowedPortfolioMetaEmojis[randomIndex] ?? '' };
};

type CustomizeWalletModalProps = StaticScreenProps<{
    portfolio?: Portfolio;
    initialMeta?: Partial<PortfolioMeta>;
    onSave?: (meta: Pick<PortfolioMeta, 'icon' | 'name'>) => Promise<void>;
    // NOTE: this callback is for navigation actions only and calling in cases when user don't save changes
    onCompleteCustomize?: () => void;
    hasBackButton?: boolean;
}>;

export const CustomizeWalletModal = (props: CustomizeWalletModalProps) => {
    const { portfolio, initialMeta, onSave, onCompleteCustomize, hasBackButton } =
        props.route?.params ?? {};
    const { t } = useTranslation();
    const fallbackName = useNewPortfolioFallbackName();
    const { mutate: changePortfolioMeta } = useChangePortfolioMeta();

    const [walletName, setWalletName] = useState(
        portfolio?.meta.name ?? initialMeta?.name ?? fallbackName
    );
    const [selectedIcon, setSelectedIcon] = useState<PortfolioMetaIcon>(
        () => portfolio?.meta.icon ?? initialMeta?.icon ?? getDefaultIcon()
    );

    const handleSave = useCallback(async () => {
        Keyboard.dismiss();
        if (portfolio) {
            changePortfolioMeta({
                portfolio,
                meta: { name: walletName.trim(), icon: selectedIcon }
            });
            onCompleteCustomize?.();
        } else {
            await onSave?.({ name: walletName.trim(), icon: selectedIcon });
        }
    }, [onCompleteCustomize, onSave, changePortfolioMeta, portfolio, walletName, selectedIcon]);

    const isNameValid = walletName.trim().length > 0;

    return (
        <Screen>
            <Screen.Header variant="left">
                {hasBackButton ? (
                    <Screen.Header.BackButton />
                ) : (
                    <Screen.Header.Button onPress={onCompleteCustomize}>
                        <Icon icon={Xmark16} />
                    </Screen.Header.Button>
                )}
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
                    onSubmitEditing={isNameValid ? handleSave : undefined}
                />
            </Screen.Content>
        </Screen>
    );
};
