import { useCallback } from 'react';

import type { Provider } from '@safely/core';

import { useErrorToast } from '../errors';
import { useLinking } from '../linking';
import { useOnrampWidgetMutation } from './useOnrampWidgetMutation';

export function useOpenOnramp() {
    const { mutateAsync, isPending } = useOnrampWidgetMutation();
    const { openURL } = useLinking();
    const errorToast = useErrorToast({});

    const openOnramp = useCallback(
        async (provider: Provider) => {
            try {
                const { widgetUrl } = await mutateAsync(provider);
                openURL(widgetUrl, { preferInApp: true });
            } catch (error) {
                errorToast(error);
            }
        },
        [mutateAsync, openURL, errorToast]
    );

    return { openOnramp, isPending };
}
