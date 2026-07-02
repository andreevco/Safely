import { DeviceModelId } from '@ledgerhq/device-management-kit';

const MODEL_NAME: Partial<Record<DeviceModelId, string>> = {
    [DeviceModelId.STAX]: 'Ledger Stax',
    [DeviceModelId.FLEX]: 'Ledger Flex',
    [DeviceModelId.NANO_X]: 'Ledger Nano X',
    [DeviceModelId.NANO_S]: 'Ledger Nano S'
};

export const getLedgerModelName = (model?: string): string =>
    (model && MODEL_NAME[model as DeviceModelId]) || 'Ledger';
