export interface BtcTransferScheme {
    name: 'btc-transfer';
    parsed: {
        address: string;
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

export type ExternalInputResult<S extends ExternalInputScheme = ExternalInputScheme> =
    | { ok: true; scheme: S }
    | { ok: false; error: string };
