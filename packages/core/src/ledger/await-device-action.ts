import { DeviceActionStatus } from '@ledgerhq/device-management-kit';
import type {
    DeviceActionIntermediateValue,
    DmkError,
    ExecuteDeviceActionReturnType
} from '@ledgerhq/device-management-kit';

type ActionType<Output> = ExecuteDeviceActionReturnType<
    Output,
    DmkError,
    DeviceActionIntermediateValue
>;

export const awaitDeviceAction = <Output>(action: ActionType<Output>): Promise<Output> =>
    new Promise((resolve, reject) => {
        const subscription = action.observable.subscribe({
            next: state => {
                if (state.status === DeviceActionStatus.Completed) {
                    subscription.unsubscribe();
                    resolve(state.output);
                } else if (state.status === DeviceActionStatus.Error) {
                    subscription.unsubscribe();
                    reject(new Error(`${state.error._tag} ${state.error?.message}`));
                }
            },
            error: error => {
                reject(error instanceof Error ? error : new Error('Device action failed'));
            }
        });
    });
