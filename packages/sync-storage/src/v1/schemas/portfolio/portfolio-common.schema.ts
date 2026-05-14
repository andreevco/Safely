import z from 'zod';

export const sPortfolioType = z.enum(['BIP39', 'WATCH_ONLY']);

export const sPortfolioNetworkType = z.enum(['MAINNET', 'TESTNET']);

const sPortfolioMetaIconEmoji = z.object({
    type: z.literal('emoji'),
    value: z.string()
});

const sPortfolioMetaIconColor = z.object({
    type: z.literal('color'),
    value: z.string()
});

const sPortfolioMetaIcon = z.union([sPortfolioMetaIconEmoji, sPortfolioMetaIconColor]);

export const sPortfolioMeta = z.object({
    name: z.string(),
    icon: sPortfolioMetaIcon
});

export type SPortfolioMeta = z.infer<typeof sPortfolioMeta>;
