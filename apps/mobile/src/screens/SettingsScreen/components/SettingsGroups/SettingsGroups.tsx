import { useTranslation } from 'react-i18next';

import { useBootConfig, useLinking } from '@safely/ux';

import { Cell, List } from '@mobile/shared/ui';

export const SettingsGroups = () => {
    const { t } = useTranslation();
    const supportEmail = useBootConfig().references.support.email;
    const { openURL } = useLinking();

    return (
        <List>
            <List.Title>{t('settings.groups.info.title')}</List.Title>
            <List.Group variant="divided">
                <Cell onPress={() => openURL(`mailto:${supportEmail}`)}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.info.options.support')}</Cell.Title>
                            <Cell.Value variant="bodyL" color="tertiary">
                                {supportEmail}
                            </Cell.Value>
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
                <Cell>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.info.options.rate')}</Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.info.options.legal')}</Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
            </List.Group>
        </List>
    );
};
