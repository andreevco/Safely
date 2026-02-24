import { ZodType } from 'zod';

import { Device } from '../device-manager/device-repository';
import { ISyncProvider } from '../sync-provider/I-sync-provider';
import { ISecretEncryptor } from '../secret-encryptor';

export interface ISyncAccount<S extends Record<string, ZodType>> {
    /**
     * The unique identifier of the sync account.
     */
    readonly accountId: string;
    /**
     * The sync provider associated with this account, used to update storage.
     */
    readonly syncProvider: ISyncProvider<S>;
    /**
     * The secret encryptor associated with this account, used to encrypt and decrypt secrets
     * before putting them into storage.
     */
    readonly secretEncryptor: ISecretEncryptor;

    /**
     * Connects a new device to the sync account using the provided onboarding data.
     * Account must be 'online' when calling this method, otherwise it will throw an error.
     * @param data
     */
    connectToNewDevice(data: Buffer): Promise<void>;

    /**
     * Retrieves the list of devices currently connected to the sync account.
     */
    getDevices(): Promise<Device[]>;

    /**
     * Revokes a remote device from the sync account using its IK public key.
     * If trying to revoke the current device, it will throw an error.
     * Use SyncAccountFactory.deleteLocalAccount to delete the local account instead.
     * @param ikPub
     */
    revokeRemoteDevice(ikPub: Buffer): Promise<void>;
}
