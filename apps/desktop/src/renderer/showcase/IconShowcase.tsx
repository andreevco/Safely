import type { FC } from 'react';

import ExclamationmarkCircle16 from '@safely/ux/assets/icons/16/exclamationmark-circle-16.svg?react';
import Plus16 from '@safely/ux/assets/icons/16/plus-16.svg?react';
import { Icon } from '@safely/web-ui';

import { ShowcaseSection, showcaseRowStyles } from './ShowcaseSection';

export const IconShowcase: FC = () => (
    <ShowcaseSection title="ICON">
        <div className={showcaseRowStyles}>
            <Icon asset={ExclamationmarkCircle16} />
            <Icon asset={ExclamationmarkCircle16} tone="tertiary" />
            <Icon asset={Plus16} />
            <Icon asset={Plus16} tone="accentGreen" />
            <Icon asset={Plus16} size={28} tone="secondary" />
        </div>
    </ShowcaseSection>
);
