import { InMemStorage } from './storage';
import { createSyncServerApiImplementations } from './sync-server-api-implementations';
import { getSyncServer } from './sync-server-registry';
import { SyncAccountFactory } from '../../src';
import { Logger } from '../../src/logger/logger';
import { QRMessageCodec, QRMessageOperation } from '../../src/onboarding/onboarding-codec';
import { Versions } from '../e2e/helpers';

let factoryCounter = 0;

export function makeFactory() {
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    let requesterIk: string | undefined;
    const apiImplementations = createSyncServerApiImplementations(getSyncServer(), () => {
        if (!requesterIk) {
            throw new Error('Requester IK is not set');
        }

        return requesterIk;
    });
    const factoryId = factoryCounter++;

    return {
        factory: new SyncAccountFactory({
            storage,
            encryptedStorage,
            versions: Versions,
            apiConfiguration: {
                basePath: 'sync-server://mock'
            },
            apiImplementations,
            pollingTimeout: 1,
            logger: new Logger().child(`property:${factoryId}`)
        }),
        setRequesterIk: (nextRequesterIk: string) => {
            requesterIk = nextRequesterIk;
        },
        setRequesterIkFromOnboardingData: (data: Buffer) => {
            const onboardingMessage = QRMessageCodec.decode(data);
            if (onboardingMessage.type !== QRMessageOperation.NEW_DEVICE_ONBOARDING) {
                throw new Error('Unexpected onboarding message type');
            }

            requesterIk = onboardingMessage.ikPub.toString('hex');
        }
    };
}
