/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

export type UseNotificationsResult =
    | {
          isLoading: true;
          isEnabled: false;
          isDenied: false;
          requestPermission?: undefined;
      }
    | {
          isLoading: false;
          isEnabled: boolean;
          isDenied: boolean;
          requestPermission: () => Promise<boolean>;
      };

export function useNotifications(): UseNotificationsResult {
    const [isDenied, setIsDenied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(false);

    const checkPermission = useCallback(async () => {
        const { status } = await Notifications.getPermissionsAsync();

        setIsEnabled(status === 'granted');
        setIsDenied(status === 'denied');
        setIsLoading(false);
    }, []);

    useEffect(() => {
        void checkPermission();
    }, [checkPermission]);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        setIsEnabled(granted);
        setIsDenied(status === 'denied');
        return granted;
    }, []);

    if (isLoading) {
        return {
            isDenied: false,
            isLoading: true,
            isEnabled: false
        };
    }

    return {
        isLoading: false,
        isEnabled,
        isDenied,
        requestPermission
    };
}
