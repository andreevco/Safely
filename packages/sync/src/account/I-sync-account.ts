import type { NewOf, StorageVersion } from '@safely/slottree';

import type { MKDerivationDomain } from '../crypto/service/master-key-service';
import type { Device } from '../device-manager/device-repository';
import type { ITreeStorage } from '../I-storage';
import type { OnboardingConnector } from '../onboarding/connector';
import type { ISecretEncryptor } from '../secret-encryptor';
import type { ISyncProvider } from '../sync-provider/I-sync-provider';

export interface ISyncAccount<Latest extends StorageVersion> {
    /**
     * The unique identifier of the sync account.
     */
    readonly accountId: string;
    /**
     * The sync provider associated with this account, used to update storage.
     */
    readonly syncProvider: ISyncProvider<NewOf<Latest>>;
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
     * @returns identity public key of the connected device
     */
    connectToNewDevice(data: Buffer, secureEncryptedStorage: ITreeStorage): Promise<Buffer>;

    /**
     * Initiates the process of reconnecting to an existing sync account.
     */
    reconnectToAccount(): Promise<OnboardingConnector<Latest>>;

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
    getMyDeviceIkPub(): Buffer;

    /**
     * Derives a new key from the account master key.
     * @param domain - must be unique
     * @param secureEncryptedStorage
     */
    deriveKeyFromMasterKey(
        domain: MKDerivationDomain,
        secureEncryptedStorage: ITreeStorage
    ): Promise<Buffer>;
}
