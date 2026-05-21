import { z } from 'zod';

export const sWalletDerivation = z
    .object({
        root_seed_key: z.hex(),
        bip39_256_wallet_index: z.number()
    })
    .nullable()
    .default(null);

export type SWalletDerivation = z.infer<typeof sWalletDerivation>;
export type WalletDerivation = Exclude<SWalletDerivation, null>;
