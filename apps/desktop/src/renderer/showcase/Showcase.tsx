import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

import { BannerShowcase } from './BannerShowcase';
import { ButtonShowcase } from './ButtonShowcase';
import { IconShowcase } from './IconShowcase';
import { InputShowcase } from './InputShowcase';
import { ListShowcase } from './ListShowcase';
import { TableShowcase } from './TableShowcase';
import { TextShowcase } from './TextShowcase';

type ShowcaseTab = {
    title: string;
    content: ReactNode;
};

const TABS: ShowcaseTab[] = [
    { title: 'Buttons', content: <ButtonShowcase /> },
    { title: 'Typography', content: <TextShowcase /> },
    { title: 'Inputs', content: <InputShowcase /> },
    { title: 'Icons', content: <IconShowcase /> },
    { title: 'Banners', content: <BannerShowcase /> },
    { title: 'Lists', content: <ListShowcase /> },
    { title: 'Tables', content: <TableShowcase /> }
];

const rootStyles = css({ display: 'flex', flexDirection: 'column', gap: '24' });

const tabsStyles = css({ display: 'flex', gap: '8', flexWrap: 'wrap' });

const panelStyles = css({ display: 'flex', flexDirection: 'column', gap: '32' });

export const Showcase: FC = () => {
    const [activeTitle, setActiveTitle] = useState(TABS[0].title);

    const activeTab = TABS.find(tab => tab.title === activeTitle) ?? TABS[0];

    return (
        <div className={rootStyles}>
            <div className={tabsStyles}>
                {TABS.map(tab => (
                    <Button
                        key={tab.title}
                        size="small"
                        variant={tab.title === activeTitle ? 'primary' : 'tertiary'}
                        onClick={() => setActiveTitle(tab.title)}
                    >
                        {tab.title}
                    </Button>
                ))}
            </div>

            <div className={panelStyles}>{activeTab.content}</div>
        </div>
    );
};
