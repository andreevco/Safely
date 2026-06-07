import { DeviceActionStatus } from '@ledgerhq/device-management-kit';
import type {
    DeviceActionIntermediateValue,
    DeviceActionState,
    DmkError
} from '@ledgerhq/device-management-kit';
import type { Observable } from 'rxjs';

export const awaitDeviceAction = <Output>(action: {
    observable: Observable<DeviceActionState<Output, DmkError, DeviceActionIntermediateValue>>;
}): Promise<Output> =>
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
            error: reject
        });
    });
