import { BleManager, State } from 'react-native-ble-plx';

export const getBluetoothState = (): Promise<State> =>
    new Promise(resolve => {
        const manager = new BleManager();

        const subscription = manager.onStateChange(state => {
            if (state === State.Unknown || state === State.Resetting) {
                return;
            }

            subscription.remove();
            manager.destroy();
            resolve(state);
        }, true);
    });
