/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { notificationsKeys } from './keys';

export function useNotificationsQuery() {
    return useQuery({
        queryKey: notificationsKeys.permissions.toKey(),
        queryFn: async () => {
            const { status } = await Notifications.getPermissionsAsync();
            return {
                isEnabled: status === 'granted',
                isDenied: status === 'denied'
            };
        },
        staleTime: Infinity
    });
}

export function useRequestNotificationPermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        },
        async onSuccess() {
            await queryClient.invalidateQueries({
                queryKey: notificationsKeys.permissions.toKey()
            });
        }
    });
}
