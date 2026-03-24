import { useTranslation } from 'react-i18next';

import { Cell } from '@mobile/shared/ui';

interface AccountCellProps {
    name: string;
    walletsCount: number;
}

export const AccountCell = (props: AccountCellProps) => {
    const { name, walletsCount } = props;

    const { t } = useTranslation();

    return (
        <Cell.Content>
            <Cell.Row>
                <Cell.Title>{name}</Cell.Title>
            </Cell.Row>
            <Cell.Row>
                <Cell.Subtitle>{t('settings.walletsCount', { count: walletsCount })}</Cell.Subtitle>
            </Cell.Row>
        </Cell.Content>
    );
};
