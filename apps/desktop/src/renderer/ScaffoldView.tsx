import type { FC } from 'react';

import { Button } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

/**
 * Proves the build targets, the design tokens and the preload bridge are wired together. The
 * router and real screens replace it; product copy appears only there, via `useTranslate()`.
 */
export const ScaffoldView: FC = () => {
    const bridge = window.safelyDesktop;

    return (
        <main
            className={css({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '16',
                padding: '32'
            })}
        >
            <h1 className={css({ fontSize: '24px', fontWeight: 700 })}>Safely Desktop</h1>

            <p className={css({ color: 'text.secondary', fontSize: '14px' })}>
                {bridge
                    ? `${bridge.platform} · electron ${bridge.versions.electron} · chromium ${bridge.versions.chrome}`
                    : 'preload bridge unavailable'}
            </p>

            <div className={css({ display: 'flex', gap: '12' })}>
                <Button>primary</Button>
                <Button variant="secondary">secondary</Button>
                <Button variant="tertiary" size="md" disabled>
                    disabled
                </Button>
            </div>
        </main>
    );
};
