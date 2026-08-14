import type { FC } from 'react';

import { Text } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

import { ButtonShowcase, IconShowcase, TextShowcase } from './showcase';

/**
 * Proves the build targets, the design tokens and the preload bridge are wired together, and
 * doubles as the only place the design system can be looked at until the router lands. The
 * router and real screens replace it; product copy appears only there, via `useTranslate()`.
 */
export const ScaffoldView: FC = () => {
    const bridge = window.safelyDesktop;

    return (
        <main
            className={css({
                display: 'flex',
                flexDirection: 'column',
                gap: '32',
                padding: '32'
            })}
        >
            <div className={css({ display: 'flex', flexDirection: 'column', gap: '4' })}>
                <Text as="h1" variant="titleM">
                    Safely Desktop
                </Text>

                <Text variant="bodyM" tone="secondary">
                    {bridge
                        ? `${bridge.platform} · electron ${bridge.versions.electron} · chromium ${bridge.versions.chrome}`
                        : 'preload bridge unavailable'}
                </Text>
            </div>

            <ButtonShowcase />
            <IconShowcase />
            <TextShowcase />
        </main>
    );
};
