import type { FC } from 'react';

import type { PortfolioMetaIcon } from '@safely/core';
import { css } from '@safely/web-ui/styled-system/css';

import { toWalletColorStyle } from './wallet-color';

export type WalletIconProps = {
    icon: PortfolioMetaIcon;
    size?: 'small' | 'medium';
};

const emojiStyles = css({
    fontSize: '16px',
    lineHeight: '20px'
});

const emojiMediumStyles = css({
    fontSize: '20px',
    lineHeight: '24px'
});

const colorStyles = css({
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: 'full',
    backgroundColor: 'var(--wallet-color)'
});

const colorMediumStyles = css({
    display: 'block',
    width: '20px',
    height: '20px',
    borderRadius: 'full',
    backgroundColor: 'var(--wallet-color)'
});

export const WalletIcon: FC<WalletIconProps> = props => {
    const { icon, size = 'small' } = props;

    if (icon.type === 'emoji') {
        return (
            <span className={size === 'medium' ? emojiMediumStyles : emojiStyles}>
                {icon.value}
            </span>
        );
    }

    return (
        <span
            className={size === 'medium' ? colorMediumStyles : colorStyles}
            style={toWalletColorStyle(icon.value)}
        />
    );
};
