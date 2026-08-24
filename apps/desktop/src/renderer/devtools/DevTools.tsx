import type { FC } from 'react';

import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';
import { AppLayout, Button, Icon, List, PageHeader } from '@safely/web-ui';
import { css } from '@safely/web-ui/styled-system/css';

import { useIsFullScreen } from '../platform';

const dragRegionStyles = css({ appRegion: 'drag' });

const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '32',
    paddingInline: '24',
    paddingBottom: '32'
});

export type DevToolsProps = {
    onClose: () => void;
};

export const DevTools: FC<DevToolsProps> = props => {
    const { onClose } = props;

    const isFullScreen = useIsFullScreen();
    const bridge = window.safelyDesktop;

    return (
        <AppLayout hasWindowControls={!isFullScreen} isFullScreen={isFullScreen}>
            <AppLayout.TitleBar className={dragRegionStyles} />

            <AppLayout.Sidebar>
                <List>
                    <List.Title>Dev tools</List.Title>

                    <List.Footer>
                        {bridge
                            ? `${bridge.platform} · electron ${bridge.versions.electron}`
                            : 'preload bridge unavailable'}
                    </List.Footer>
                </List>
            </AppLayout.Sidebar>

            <AppLayout.Content>
                <PageHeader
                    title="Dev tools"
                    actions={
                        <Button
                            variant="secondary"
                            size="small"
                            isIconOnly
                            aria-label="Back to the app"
                            onClick={onClose}
                        >
                            <Icon asset={Xmark16} />
                        </Button>
                    }
                />

                <div className={contentStyles} />
            </AppLayout.Content>
        </AppLayout>
    );
};
