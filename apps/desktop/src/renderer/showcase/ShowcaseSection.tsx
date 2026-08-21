import type { FC, ReactNode } from 'react';

import { Text } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

export type ShowcaseSectionProps = {
    title: string;
    children: ReactNode;
};

const sectionStyles = css({ display: 'flex', flexDirection: 'column', gap: '8' });

export const showcaseRowStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '12',
    flexWrap: 'wrap'
});

export const showcaseColumnStyles = css({ display: 'flex', flexDirection: 'column', gap: '16' });

export const ShowcaseSection: FC<ShowcaseSectionProps> = props => {
    const { title, children } = props;

    return (
        <section className={sectionStyles}>
            <Text variant="labelS" tone="tertiary">
                {title}
            </Text>

            {children}
        </section>
    );
};
