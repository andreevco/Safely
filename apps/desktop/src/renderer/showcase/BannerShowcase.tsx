import type { FC } from 'react';
import { useState } from 'react';

import ExclamationmarkCircle16 from '@safely/ux/assets/icons/16/exclamationmark-circle-16.svg?react';
import type { BannerTone } from '@safely/web-ui';
import { Banner, Button } from '@safely/web-ui';

import { ShowcaseSection, showcaseColumnStyles } from './ShowcaseSection';

const TONES: BannerTone[] = ['default', 'warn', 'danger'];

export const BannerShowcase: FC = () => {
    const [dismissed, setDismissed] = useState<BannerTone[]>([]);

    return (
        <>
            <ShowcaseSection title="TONES">
                <div className={showcaseColumnStyles}>
                    {TONES.map(tone => (
                        <Banner key={tone} tone={tone}>
                            <Banner.Content>
                                <Banner.Text>Description</Banner.Text>
                            </Banner.Content>
                        </Banner>
                    ))}
                </div>
            </ShowcaseSection>

            <ShowcaseSection title="ICON, ACTION, DISMISS">
                <div className={showcaseColumnStyles}>
                    {TONES.filter(tone => !dismissed.includes(tone)).map(tone => (
                        <Banner key={tone} tone={tone}>
                            <Banner.Content>
                                <Banner.Text>Description</Banner.Text>
                                <Banner.Action>Link button</Banner.Action>
                            </Banner.Content>

                            <Banner.Icon asset={ExclamationmarkCircle16} />

                            <Banner.Close
                                label={`Dismiss ${tone}`}
                                onClick={() => setDismissed(current => [...current, tone])}
                            />
                        </Banner>
                    ))}
                </div>
            </ShowcaseSection>

            <ShowcaseSection title="NESTED BUTTON, WHOLE BANNER PRESSABLE">
                <div className={showcaseColumnStyles}>
                    <Banner>
                        <Banner.Content>
                            <Banner.Text>Description</Banner.Text>
                            <Button variant="tertiary" size="small">
                                Button
                            </Button>
                        </Banner.Content>
                    </Banner>

                    <Banner tone="warn" onClick={() => undefined}>
                        <Banner.Content>
                            <Banner.Text>The whole banner is a button</Banner.Text>
                        </Banner.Content>
                    </Banner>
                </div>
            </ShowcaseSection>
        </>
    );
};
