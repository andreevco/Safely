export type LinkTarget = { kind: 'telegram' } | { kind: 'whatsapp' } | { kind: 'article' };

export interface ParagraphBlock {
    type: 'paragraph';
    i18nKey: string;
    links?: Record<string, LinkTarget>;
}

export interface HeadingBlock {
    type: 'heading';
    i18nKey: string;
}

export interface ListBlock {
    type: 'list';
    items: string[];
}

export type AboutBlock = ParagraphBlock | HeadingBlock | ListBlock;

export interface AboutCard {
    id: string;
    publishedAt: number;
    blocks: AboutBlock[];
}

export const ABOUT_CARDS: AboutCard[] = [
    {
        id: 'beta-notice',
        publishedAt: new Date(2026, 4, 19).getTime(),
        blocks: [{ type: 'paragraph', i18nKey: 'safelyBeta.cards.betaNotice' }]
    },
    {
        id: 'follow-updates',
        publishedAt: new Date(2026, 4, 19).getTime(),
        blocks: [
            {
                type: 'paragraph',
                i18nKey: 'safelyBeta.cards.follow',
                links: { tg: { kind: 'telegram' }, wa: { kind: 'whatsapp' } }
            }
        ]
    },
    {
        id: 'feedback',
        publishedAt: new Date(2026, 4, 19).getTime(),
        blocks: [
            {
                type: 'paragraph',
                i18nKey: 'safelyBeta.cards.feedback',
                links: { action: { kind: 'telegram' } }
            }
        ]
    }
];
