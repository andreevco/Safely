import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

import type { SendFormView } from '@safely/ux';

export function useResetSubmittedOnFocus(view: SendFormView) {
    const viewRef = useRef(view);
    viewRef.current = view;

    useFocusEffect(
        useCallback(() => {
            if (viewRef.current.state === 'submitted') {
                viewRef.current.backToEditing();
            }
        }, [])
    );
}
