import type { FC } from 'react';

import { useTranslate } from '@safely/ux';
import Plus28 from '@safely/ux/assets/icons/28/plus-28.svg?react';

import { actionStyles, badgeStyles, subtitleStyles } from './MainEmptyState.styles';
import { centeredContentStyles } from './MainLayout.styles';
import { Button, Icon, Text } from '../../shared';

export type MainEmptyStateProps = {
    onAddWallet: () => void;
};

export const MainEmptyState: FC<MainEmptyStateProps> = ({ onAddWallet }) => {
    const t = useTranslate();

    return (
        <div className={centeredContentStyles}>
            <div className={badgeStyles}>
                <Icon asset={Plus28} size={24} tone="inherit" />
            </div>

            <Text variant="titleS">{t('home.emptyState.title')}</Text>
            <Text variant="bodyM" tone="secondary" align="center" className={subtitleStyles}>
                {t('home.emptyState.subtitle')}
            </Text>

            <Button className={actionStyles} variant="primary" size="small" onClick={onAddWallet}>
                {t('addWallet.title')}
            </Button>
        </div>
    );
};
