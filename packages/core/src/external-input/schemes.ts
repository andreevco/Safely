import type { BtcNetwork } from '../entities';

export interface BtcTransferScheme {
    name: 'btc-transfer';
    parsed: {
        address: string;
        network: BtcNetwork;
        amount?: string;
        label?: string;
        message?: string;
    };
}

export type ExternalInputScheme = BtcTransferScheme;
export type ExternalInputSchemeName = ExternalInputScheme['name'];

export type SchemeByName<SName extends ExternalInputSchemeName = ExternalInputSchemeName> = Extract<
    ExternalInputScheme,
    { name: SName }
>;
