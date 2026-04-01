export interface PortfolioMeta {
    name: string;
    icon: PortfolioMetaIcon;
}

export type NoIconPortfolioMeta = Omit<PortfolioMeta, 'icon'> & {
    icon?: PortfolioMetaIcon;
};

export type PortfolioMetaIcon = PortfolioMetaIconEmoji | PortfolioMetaIconColor;
export type PortfolioMetaIconEmoji = {
    type: 'emoji';
    value: string;
};

export type PortfolioMetaIconColor = {
    type: 'color';
    value: string;
};

export const allowedPortfolioMetaColors = [
    '#1E90FF',
    '#FF5555',
    '#FFB347',
    '#3CCB7F',
    '#47C8FF',
    '#925CFF',
    '#FF479D',
    '#6E6E73'
];

export const allowedPortfolioMetaEmojis = [
    '🙂',
    '😎',
    '😝',
    '🤑',
    '😊',
    '🙃',
    '🥴',
    '😭',
    '🤡',
    '👽',
    '🐵',
    '🐻‍❄️',
    '🐻',
    '🐼',
    '🐶',
    '🐨',
    '🐲',
    '🐸',
    '🐙',
    '🦀',
    '🪼',
    '🐡',
    '🐋',
    '🐝',
    '🍀',
    '🌵',
    '🌳',
    '🍄',
    '🌿',
    '🌸',
    '🌺',
    '🌼',
    '🍋',
    '🍑',
    '🍏',
    '🍎',
    '🍊',
    '🍐',
    '🍓',
    '🥝',
    '🌽',
    '🍆',
    '🥦',
    '🥑',
    '🍔',
    '🥐',
    '🍩',
    '🧁',
    '🍪',
    '🍤',
    '🥩',
    '🍣',
    '🥞',
    '🥟',
    '🍾',
    '🍺',
    '⚽',
    '🏀',
    '⚾',
    '🎾',
    '🏈',
    '🏉',
    '🪩',
    '🎱',
    '🌍',
    '🌎',
    '🌏',
    '🧭',
    '🏝️',
    '🚂',
    '🛵',
    '🚌',
    '🚗',
    '🚙',
    '🚓',
    '🚜',
    '⛵',
    '🛩️',
    '🚀',
    '🛰️',
    '👟',
    '🎒',
    '🧳',
    '👜',
    '💵',
    '🪙',
    '⏰',
    '💍',
    '🧠',
    '🗿',
    '💎',
    '🔗',
    '⚙️',
    '🛠️',
    '📎',
    '🔩',
    '📦',
    '💿',
    '📽️',
    '📷',
    '💊',
    '🧿',
    '💥',
    '☁️'
];
