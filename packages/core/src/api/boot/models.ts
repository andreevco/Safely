import z from 'zod';

import { Build, UserCountryInfo } from '../../entities';

export interface BootParams {
    build: Build;
    version: string; // x.y.z
    userCountryInfo?: Partial<UserCountryInfo>;
    lang: string;
}

export type BootConfig = z.infer<typeof bootConfigSchema>;

export const bootConfigSchema = z.looseObject({
    blockchains: z.looseObject({
        bitcoin: z.looseObject({
            mainnet: z.looseObject({
                api_url: z.string(),
                explorer_account_url: z.string(),
                explorer_tx_url: z.string()
            })
        })
    }),

    currencies: z.looseObject({
        prices_api_url: z.string(),
        supported_currencies: z.array(
            z.looseObject({
                description: z.string(),
                slug: z.string()
            })
        )
    }),

    flags: z.looseObject({}),

    latest_app_version: z.looseObject({
        version: z.string()
    }),

    references: z.looseObject({
        legal: z.looseObject({
            privacy_url: z.string(),
            terms_url: z.string()
        }),
        support: z.looseObject({
            email: z.string()
        })
    })
});
