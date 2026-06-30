import type { BleManager } from 'react-native-ble-plx';
import { State } from 'react-native-ble-plx';

export const getBluetoothState = (manager: BleManager): Promise<State> =>
    new Promise(resolve => {
        const subscription = manager.onStateChange(state => {
            if (state === State.Unknown || state === State.Resetting) {
                return;
            }

            subscription.remove();
            resolve(state);
        }, true);
    });
