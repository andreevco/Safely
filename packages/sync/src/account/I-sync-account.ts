import { ZodType } from 'zod';

import { Device } from '../device-manager/device-repository';
import { ITreeStorage } from '../I-storage';
import { OnboardingConnector } from '../onboarding/connector';
import { ISecretEncryptor } from '../secret-encryptor';
import { ISyncProvider } from '../sync-provider/I-sync-provider';

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
     * If the account is offline, it will be promoted to online automatically.
     * @param data
     * @param secureEncryptedStorage - unlocked secure encrypted storage
     */
    connectToNewDevice(data: Buffer, secureEncryptedStorage: ITreeStorage): Promise<void>;

    /**
     * Initiates the process of reconnecting to an existing sync account.
     */
    reconnectToAccount(): Promise<OnboardingConnector<S>>;

    /**
     * Retrieves the list of devices currently connected to the sync account.
     */
    getDevices(): Promise<Device[]>;

    /**
     * Revokes a remote device from the sync account using its IK public key.
     * If trying to revoke the current device, it will throw an error.
     * Use SyncAccountFactory.deleteLocalAccount to delete the local account instead.
     * @param ikPub
     * @param secureEncryptedStorage - unlocked secure encrypted storage
     */
    revokeRemoteDevice(ikPub: Buffer, secureEncryptedStorage: ITreeStorage): Promise<void>;

    /**
     * Returns the IK public key of the current device.
     */
    getMyDeviceIkPub(): Promise<Buffer>;
}
