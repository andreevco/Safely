import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import z from 'zod';

import { useSharedUnstructuredKeychainStorage, useSuspenseQuery } from '@safely/ux';

import { navigationRef } from '@mobile/app/navigation/navigationRef';
import { StorageKey } from '@mobile/shared/constants';

import { passcodeKeys } from './keys';
import { PromptAndCheckOptions } from './types';

export type UsePasscodeResult =
    | {
          isSet: true;
          passcodeLength: number;
          set: (passcode: string) => Promise<void>;
          remove: () => Promise<void>;
          validate: (input: string) => Promise<boolean>;
          promptAndCheck: (options?: PromptAndCheckOptions) => Promise<void>;
      }
    | {
          isSet: false;
          passcodeLength?: undefined;
          validate?: undefined;
          remove?: undefined;
          promptAndCheck?: undefined;
          set: (input: string) => Promise<void>;
      };

const sPasscode = z.string();

export function usePasscode(): UsePasscodeResult {
    const client = useQueryClient();
    const {
        get: storageGet,
        set: storageSet,
        remove: storageRemove
    } = useSharedUnstructuredKeychainStorage(StorageKey.PASSCODE, sPasscode);

    const passcodeQuery = useSuspenseQuery({
        queryKey: passcodeKeys.state.toKey(),
        async queryFn() {
            const passcode = await storageGet();

            if (passcode === null) {
                return {
                    isSet: false
                } as const;
            } else {
                return {
                    isSet: true,
                    passcodeLength: passcode.length
                } as const;
            }
        }
    });

    const validate = useCallback(
        async (input: string) => {
            const passcode = await storageGet();

            if (passcode === null) {
                throw new Error('Can not validate passcode that is not set.');
            }

            return passcode === input;
        },
        [storageGet]
    );

    const promptAndCheck = useCallback(
        (options?: PromptAndCheckOptions): Promise<void> =>
            new Promise<void>((resolve, reject) => {
                navigationRef.current?.navigate('PasscodeVerificationScreen', {
                    onSuccess: resolve,
                    onClose: reject,
                    title: options?.title
                });
            }),
        []
    );

    const set = useCallback(
        async (input: string) => {
            await storageSet(input);
            await client.invalidateQueries({
                queryKey: passcodeKeys.state.toKey()
            });
        },
        [client, storageSet]
    );

    const remove = useCallback(async () => {
        await storageRemove();
        await client.invalidateQueries({
            queryKey: passcodeKeys.state.toKey()
        });
    }, [client, storageRemove]);

    if (passcodeQuery.data.isSet) {
        return {
            set,
            remove,
            validate,
            promptAndCheck,
            ...passcodeQuery.data
        };
    } else {
        return {
            set,
            isSet: false
        };
    }
}
