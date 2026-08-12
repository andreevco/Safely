import { DeviceModelId } from '@ledgerhq/device-management-kit';
import type { ImageSourcePropType } from 'react-native';

import { resources } from '@mobile/shared/resources';

const LEDGER_IMAGE: Partial<Record<DeviceModelId, ImageSourcePropType>> = {
    [DeviceModelId.STAX]: resources.ledgerCovers.stax,
    [DeviceModelId.FLEX]: resources.ledgerCovers.flex,
    [DeviceModelId.NANO_X]: resources.ledgerCovers.xNano,
    [DeviceModelId.NANO_S]: resources.ledgerCovers.xNanoGen5
};

export const getLedgerImage = (model?: string): ImageSourcePropType =>
    (model && LEDGER_IMAGE[model as DeviceModelId]) || resources.ledgerPreview;
