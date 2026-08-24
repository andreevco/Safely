import type { FC } from 'react';

import type { PortfolioMetaIcon } from '@safely/core';

import { toWalletColorStyle } from './wallet-color';
import {
    colorMediumStyles,
    colorStyles,
    emojiMediumStyles,
    emojiStyles
} from './WalletIcon.styles';

export type WalletIconProps = {
    icon: PortfolioMetaIcon;
    size?: 'small' | 'medium';
};

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
