import { sPushDeviceId } from './device-id.schema';
import { sPushGroupIds } from './group-ids.schema';

export const pushSubscriptionStorageStructure = {
    deviceId: sPushDeviceId,
    groupIds: sPushGroupIds
} as const;

export type PushSubscriptionStorageStructure = typeof pushSubscriptionStorageStructure;
