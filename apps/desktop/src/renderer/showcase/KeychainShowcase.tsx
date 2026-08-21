import type { FC } from 'react';
import { useState } from 'react';

import { Button, Input, Text } from '@safely/web-ui';

import { ShowcaseSection, showcaseColumnStyles, showcaseRowStyles } from './ShowcaseSection';

const PROBE_KEY = 'test';

/**
 * A temporary probe for the secret store: the only way to make the keychain do real work from the
 * running app until onboarding exists. It goes away with the first screen that stores a key.
 */
export const KeychainShowcase: FC = () => {
    const [draft, setDraft] = useState('');
    const [result, setResult] = useState('');

    const bridge = window.safelyDesktop;

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
        <ShowcaseSection title="ENCRYPTED STORE">
            <div className={showcaseColumnStyles}>
                <Input>
                    <Input.Label>{`encryptedStore["${PROBE_KEY}"]`}</Input.Label>
                    <Input.Field
                        value={draft}
                        placeholder="Value to store"
                        onChange={event => setDraft(event.target.value)}
                        onClear={() => setDraft('')}
                        clearLabel="Clear the value"
                    />
                </Input>

                <div className={showcaseRowStyles}>
                    <Button size="medium" onClick={write}>
                        Write
                    </Button>
                    <Button size="medium" variant="secondary" onClick={read}>
                        Read
                    </Button>
                </div>

                <Text variant="bodyM" tone="secondary">
                    {result}
                </Text>
            </div>
        </ShowcaseSection>
    );
};
