import type { FC } from 'react';

import type { TextProps } from '@safely/web-ui';
import { Text } from '@safely/web-ui';

import { ShowcaseSection, showcaseColumnStyles } from './ShowcaseSection';

const VARIANTS: NonNullable<TextProps['variant']>[] = [
    'displayL',
    'titleL',
    'titleM',
    'titleS',
    'labelL',
    'labelM',
    'labelS',
    'bodyL',
    'bodyLMono',
    'bodyM',
    'bodyS'
];

export const TextShowcase: FC = () => (
    <ShowcaseSection title="TEXT">
        <div className={showcaseColumnStyles}>
            {VARIANTS.map(variant => (
                <Text key={variant} variant={variant}>
                    {variant}
                </Text>
            ))}
        </div>
    </ShowcaseSection>
);
