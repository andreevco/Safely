import z from 'zod';

export const sWalletDerivation = z
    .object({
        root_seed_key: z.hex(),
        bip39_256_wallet_index: z.number()
    })
    .nullable();

export type WalletDerivation = Exclude<z.infer<typeof sWalletDerivation>, null>;
