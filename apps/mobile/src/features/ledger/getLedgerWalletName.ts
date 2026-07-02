import { getLedgerModelName } from './getLedgerModelName';

export const getLedgerWalletName = (model: string | undefined, fallbackNumber: number): string => {
    const modelName = getLedgerModelName(model);

    return modelName === 'Ledger' ? `Ledger ${fallbackNumber}` : modelName;
};
