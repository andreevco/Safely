import type { Logger } from '@safely/sync';

import type { PushDeviceCredentials, SubscriptionGroup, TargetRefs } from './models';
import { replaceGroupResponseSchema } from './models';
import type { IIdentifiable } from '../../utils';
import { ApiClient } from '../../utils/fetch';

export class NotificationsApi extends ApiClient implements IIdentifiable {
    public readonly id: string;

    constructor(options: { baseUrl: string; logger?: Logger }) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        super(baseUrl, {}, options.logger);

        this.id = `${this.constructor.name}:${baseUrl}`;
    }

    public async replaceGroup(
        deviceId: string,
        groupId: string,
        group: SubscriptionGroup,
        credentials: PushDeviceCredentials
    ): Promise<TargetRefs> {
        const response = await this.putJson(
            `/api/v1/devices/${deviceId}/subscriptions/${groupId}`,
            group,
            replaceGroupResponseSchema,
            {
                headers: {
                    'X-Safely-Push-Token': credentials.pushToken,
                    'X-Safely-Push-Platform': credentials.platform
                }
            }
        );

        return response.target_refs;
    }

    public deleteGroup(deviceId: string, groupId: string): Promise<void> {
        return this.deleteRequest(`/api/v1/devices/${deviceId}/subscriptions/${groupId}`);
    }

    public deleteDevice(deviceId: string): Promise<void> {
        return this.deleteRequest(`/api/v1/devices/${deviceId}`);
    }
}
