import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useSuspenseQuery } from '@safely/ux';

import { passcodeKeys } from './keys';
import type { PasscodeStorage } from './types';

export type UsePasscodeResult =
    | {
          isSet: true;
          length: number;
          validate: (input: string) => Promise<boolean>;
          set: (passcode: string) => Promise<void>;
      }
    | {
          isSet: false;
          length?: undefined;
          validate?: undefined;
          set: (passcode: string) => Promise<void>;
      };

export function usePasscode(storage: PasscodeStorage): UsePasscodeResult {
    const client = useQueryClient();

    const { data } = useSuspenseQuery({
        queryKey: passcodeKeys.state.toKey(),
        async queryFn() {
            const passcode = await storage.get();

            return passcode === null
                ? ({ isSet: false } as const)
                : ({ isSet: true, length: passcode.length } as const);
        }
    });

    const validate = useCallback(
        async (input: string) => {
            const passcode = await storage.get();

            if (passcode === null) {
                throw new Error('Can not validate passcode that is not set.');
            }

            return passcode === input;
        },
        [storage]
    );

    const set = useCallback(
        async (passcode: string) => {
            await storage.set(passcode);
            await client.invalidateQueries({ queryKey: passcodeKeys.state.toKey() });
        },
        [client, storage]
    );

    return data.isSet ? { isSet: true, length: data.length, validate, set } : { isSet: false, set };
}
