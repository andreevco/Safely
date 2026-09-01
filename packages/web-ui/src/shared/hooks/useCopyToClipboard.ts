import { useCallback, useEffect, useRef, useState } from 'react';

const COPIED_VISIBLE_MS = 1600;

export function useCopyToClipboard() {
    const [isCopied, setIsCopied] = useState(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timeout.current), []);

    const copy = useCallback((value: string) => {
        void navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true);
            clearTimeout(timeout.current);
            timeout.current = setTimeout(() => setIsCopied(false), COPIED_VISIBLE_MS);
        });
    }, []);

    return { isCopied, copy };
}
