import type { FC } from 'react';
import { useState } from 'react';

import { Button } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

const PROBE_KEY = 'test';

/**
 * Proves the build targets, the design tokens and the preload bridge are wired together. The
 * router and real screens replace it; product copy appears only there, via `useTranslate()`.
 *
 * The encrypted-store panel is a temporary probe for the secret store: it is the only way to make
 * the keychain do real work from the running app until onboarding exists.
 */
export const ScaffoldView: FC = () => {
    const bridge = window.safelyDesktop;

    const [draft, setDraft] = useState('');
    const [result, setResult] = useState('');

    const run = (operation: () => Promise<string>): void => {
        void operation().then(setResult, (cause: unknown) => {
            setResult(cause instanceof Error ? `error: ${cause.message}` : 'error: unknown');
        });
    };

    const write = (): void =>
        run(async () => {
            await bridge?.encryptedStore.set(PROBE_KEY, draft);

            return `written ${JSON.stringify(draft)}`;
        });

    const read = (): void =>
        run(async () => {
            const stored = await bridge?.encryptedStore.get(PROBE_KEY);

            return stored === null || stored === undefined
                ? '(empty)'
                : `read ${JSON.stringify(stored)}`;
        });

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

            <section className={css({ display: 'flex', flexDirection: 'column', gap: '12' })}>
                <input
                    value={draft}
                    placeholder={`encryptedStore["${PROBE_KEY}"]`}
                    onChange={event => setDraft(event.target.value)}
                    className={css({
                        background: 'input.background',
                        color: 'text.primary',
                        borderRadius: '8px',
                        padding: '12',
                        fontSize: '14px',
                        minWidth: '320px'
                    })}
                />

                <div className={css({ display: 'flex', gap: '12' })}>
                    <Button size="md" onClick={write}>
                        write
                    </Button>
                    <Button size="md" variant="secondary" onClick={read}>
                        read
                    </Button>
                </div>

                <pre
                    className={css({
                        color: 'text.secondary',
                        fontSize: '14px',
                        minHeight: '20px'
                    })}
                >
                    {result}
                </pre>
            </section>
        </main>
    );
};
