/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { useSharedUxStorage, useMutation } from '@safely/ux';

import { notificationsKeys } from './keys';

export function useNotificationsQuery() {
    const { get } = useSharedUxStorage('notificationsEnabled');

    return useQuery({
        queryKey: notificationsKeys.permissions.toKey(),
        queryFn: async () => {
            const [{ status }, preference] = await Promise.all([
                Notifications.getPermissionsAsync(),
                get()
            ]);

            return {
                isEnabled: preference ?? false,
                isDenied: status === 'denied'
            };
        },
        staleTime: Infinity
    });
}

export function useToggleNotifications() {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage('notificationsEnabled');

    return useMutation({
        mutationFn: async (isEnabled: boolean) => {
            if (isEnabled) {
                await Notifications.requestPermissionsAsync();
            }
            await set(isEnabled);
        },
        async onSuccess() {
            await queryClient.invalidateQueries({
                queryKey: notificationsKeys.permissions.toKey()
            });
        }
    });
}

export function useRequestNotificationPermission() {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage('notificationsEnabled');

    return useMutation({
        mutationFn: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            const isGranted = status === 'granted';
            await set(isGranted);

            return isGranted;
        },
        async onSuccess() {
            await queryClient.invalidateQueries({
                queryKey: notificationsKeys.permissions.toKey()
            });
        }
    });
}
