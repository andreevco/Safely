import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAppContext, useSuspenseQuery } from '@safely/ux';

import { lockScreenKeys } from './keys';

const LOCK_SCREEN_KEY = 'lockScreenEnabled';

export function useLockScreen() {
    const { storage } = useAppContext();
    const client = useQueryClient();

    const node = useMemo(() => storage.ux.regular.child('web'), [storage.ux.regular]);

    const { data: isEnabled } = useSuspenseQuery({
        queryKey: lockScreenKeys.state.toKey(),
        queryFn: async () => (await node.getItem(LOCK_SCREEN_KEY)) !== 'false',
        staleTime: Infinity
    });

    const { mutateAsync: setEnabled } = useMutation({
        mutationFn: (enabled: boolean) => node.setItem(LOCK_SCREEN_KEY, String(enabled)),
        onSuccess: () => client.invalidateQueries({ queryKey: lockScreenKeys.state.toKey() })
    });

    return { isEnabled, setEnabled };
}
