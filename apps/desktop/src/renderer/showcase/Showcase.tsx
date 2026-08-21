import type { FC, ReactNode } from 'react';
import { useState } from 'react';

import Sliders16 from '@safely/ux/assets/icons/16/sliders-16.svg?react';
import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';
import { AppLayout, Button, Cell, Icon, List, PageHeader } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

import { useIsFullScreen } from '../platform';
import { BannerShowcase } from './BannerShowcase';
import { ButtonShowcase } from './ButtonShowcase';
import { IconShowcase } from './IconShowcase';
import { InputShowcase } from './InputShowcase';
import { KeychainShowcase } from './KeychainShowcase';
import { ListShowcase } from './ListShowcase';
import { ModalShowcase } from './ModalShowcase';
import { TableShowcase } from './TableShowcase';
import { TextShowcase } from './TextShowcase';

type ShowcaseSection = {
    title: string;
    content: ReactNode;
};

const SECONDARY_ITEMS = ['Me', 'Edit account', 'Address book', 'Add account'];

const SECTIONS: ShowcaseSection[] = [
    { title: 'Buttons', content: <ButtonShowcase /> },
    { title: 'Typography', content: <TextShowcase /> },
    { title: 'Inputs', content: <InputShowcase /> },
    { title: 'Icons', content: <IconShowcase /> },
    { title: 'Banners', content: <BannerShowcase /> },
    { title: 'Lists', content: <ListShowcase /> },
    { title: 'Tables', content: <TableShowcase /> },
    { title: 'Modal', content: <ModalShowcase /> },
    { title: 'Keychain', content: <KeychainShowcase /> }
];

const dragRegionStyles = css({ appRegion: 'drag' });

const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '32',
    paddingInline: '24',
    paddingBottom: '32'
});

export const Showcase: FC = () => {
    const [activeTitle, setActiveTitle] = useState(SECTIONS[0].title);
    const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);

    const bridge = window.safelyDesktop;
    const isFullScreen = useIsFullScreen();
    const activeSection = SECTIONS.find(section => section.title === activeTitle) ?? SECTIONS[0];

    return (
        <AppLayout hasWindowControls={!isFullScreen} isFullScreen={isFullScreen}>
            <AppLayout.TitleBar className={dragRegionStyles} />

            <AppLayout.Sidebar>
                <List>
                    <List.Title>Design system</List.Title>

                    <List.Group variant="separated">
                        {SECTIONS.map(section => (
                            <Cell key={section.title} onClick={() => setActiveTitle(section.title)}>
                                <Cell.Content>
                                    <Cell.Title>{section.title}</Cell.Title>
                                </Cell.Content>
                                {section.title === activeTitle && <Cell.Checkmark />}
                            </Cell>
                        ))}
                    </List.Group>

                    <List.Group variant="separated">
                        <Cell onClick={() => setIsSecondaryOpen(current => !current)}>
                            <Cell.Leading>
                                <Icon asset={Sliders16} tone="secondary" />
                            </Cell.Leading>
                            <Cell.Content>
                                <Cell.Title>Second column</Cell.Title>
                            </Cell.Content>
                        </Cell>
                    </List.Group>

                    <List.Footer>
                        {bridge
                            ? `${bridge.platform} · electron ${bridge.versions.electron}`
                            : 'preload bridge unavailable'}
                    </List.Footer>
                </List>
            </AppLayout.Sidebar>

            {isSecondaryOpen && (
                <AppLayout.Secondary>
                    <PageHeader
                        title="Second column"
                        actions={
                            <Button
                                variant="secondary"
                                size="small"
                                isIconOnly
                                aria-label="Close the second column"
                                onClick={() => setIsSecondaryOpen(false)}
                            >
                                <Icon asset={Xmark16} />
                            </Button>
                        }
                    />

                    <List>
                        <List.Title>Settings</List.Title>
                        <List.Group variant="separated">
                            {SECONDARY_ITEMS.map(item => (
                                <Cell key={item} onClick={() => undefined}>
                                    <Cell.Content>
                                        <Cell.Title>{item}</Cell.Title>
                                    </Cell.Content>
                                </Cell>
                            ))}
                        </List.Group>
                    </List>
                </AppLayout.Secondary>
            )}

            <AppLayout.Content>
                <PageHeader title={activeSection.title} />

                <div className={contentStyles}>{activeSection.content}</div>
            </AppLayout.Content>
        </AppLayout>
    );
};
