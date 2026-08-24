import type { FC } from 'react';

import {
    useActiveAccountStoreSlot,
    useAppContext,
    useActiveFiat,
    useActiveLanguage,
    useActiveWalletMeta,
    usePortfolios,
    useTranslate
} from '@safely/ux';

import type { SettingsSection } from './settings';
import { listStyles, versionStyles } from './SettingsSidebar.styles';
import { WalletIcon } from '../../entities';
import { AppLayout, Cell, List, PageHeader, Text, useLongPress } from '../../shared';

export type SettingsSidebarProps = {
    activeSection: SettingsSection | null;
    onSelectSection: (section: SettingsSection) => void;
    onAddWallet: () => void;
    onSignOut: () => void;
    onOpenDevTools: () => void;
};

export const SettingsSidebar: FC<SettingsSidebarProps> = props => {
    const { activeSection, onSelectSection, onAddWallet, onSignOut, onOpenDevTools } = props;

    const { version } = useAppContext();
    const longPress = useLongPress(onOpenDevTools);
    const t = useTranslate();
    const fiat = useActiveFiat();
    const language = useActiveLanguage();
    const portfolios = usePortfolios();
    const walletMeta = useActiveWalletMeta();
    const accountMeta = useActiveAccountStoreSlot('meta');

    return (
        <AppLayout.Secondary>
            <AppLayout.SecondaryContent>
                <PageHeader title={t('settings.title')} hasDivider />

                <List className={listStyles}>
                    <List.Title>{t('settings.groups.currentWallet.title')}</List.Title>
                    <List.Group variant="separated">
                        <Cell onClick={() => undefined}>
                            <Cell.Leading>
                                <WalletIcon icon={walletMeta.icon} />
                            </Cell.Leading>
                            <Cell.Content>
                                <Cell.Title>{walletMeta.name}</Cell.Title>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <List.Title>{t('settings.groups.account.title')}</List.Title>
                    <List.Group variant="separated">
                        <Cell onClick={() => undefined}>
                            <Cell.Content>
                                <Cell.Title>{accountMeta?.name}</Cell.Title>
                                <Cell.Subtitle>
                                    {t('settings.walletsCount', { count: portfolios.length })}
                                </Cell.Subtitle>
                            </Cell.Content>
                        </Cell>
                        <Cell onClick={() => undefined}>
                            <Cell.Content>
                                <Cell.Title>
                                    {t('settings.groups.account.options.editAccount')}
                                </Cell.Title>
                            </Cell.Content>
                        </Cell>
                        <Cell onClick={() => undefined}>
                            <Cell.Content>
                                <Cell.Title>
                                    {t('settings.groups.account.options.addressBook')}
                                </Cell.Title>
                            </Cell.Content>
                        </Cell>
                        <Cell onClick={onAddWallet}>
                            <Cell.Content>
                                <Cell.Title>{t('settings.addAccount')}</Cell.Title>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <List.Title>{t('settings.groups.application.title')}</List.Title>
                    <List.Group variant="separated">
                        <Cell
                            isSelected={activeSection === 'security'}
                            onClick={() => onSelectSection('security')}
                        >
                            <Cell.Content>
                                <Cell.Title>
                                    {t('settings.groups.application.options.security')}
                                </Cell.Title>
                            </Cell.Content>
                        </Cell>
                        <Cell
                            isSelected={activeSection === 'language'}
                            onClick={() => onSelectSection('language')}
                        >
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>
                                        {t('settings.groups.application.options.language')}
                                    </Cell.Title>
                                    <Cell.Value>{t(`language.languages.${language}`)}</Cell.Value>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                        <Cell
                            isSelected={activeSection === 'currency'}
                            onClick={() => onSelectSection('currency')}
                        >
                            <Cell.Content>
                                <Cell.Row>
                                    <Cell.Title>{t('currency.title')}</Cell.Title>
                                    <Cell.Value>{fiat.id.symbol}</Cell.Value>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <List.Title>{t('settings.groups.info.title')}</List.Title>
                    <List.Group variant="separated">
                        <Cell onClick={() => undefined}>
                            <Cell.Content>
                                <Cell.Title>{t('settings.groups.info.options.support')}</Cell.Title>
                            </Cell.Content>
                        </Cell>
                        <Cell
                            isSelected={activeSection === 'legal'}
                            onClick={() => onSelectSection('legal')}
                        >
                            <Cell.Content>
                                <Cell.Title>{t('settings.groups.info.options.legal')}</Cell.Title>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <List.Group variant="separated">
                        <Cell tone="accentRed" onClick={onSignOut}>
                            <Cell.Content>
                                <Cell.Title>
                                    {t('settings.signOutAccount.title', {
                                        name: accountMeta?.name ?? ''
                                    })}
                                </Cell.Title>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <Text variant="bodyM" tone="tertiary" className={versionStyles} {...longPress}>
                        {`Safely · ${version}`}
                    </Text>
                </List>
            </AppLayout.SecondaryContent>
        </AppLayout.Secondary>
    );
};
