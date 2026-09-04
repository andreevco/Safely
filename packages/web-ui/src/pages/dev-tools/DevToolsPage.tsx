import type { FC } from 'react';

import { useAppContext } from '@safely/ux';
import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';

import { contentStyles, dragRegionStyles } from './DevToolsPage.styles';
import { KeychainSection } from './KeychainSection';
import { AppLayout, Button, Icon, List, PageHeader } from '../../shared';

export type DevToolsPageProps = {
    hasWindowControls?: boolean;
    isFullScreen?: boolean;
    onClose: () => void;
};

export const DevToolsPage: FC<DevToolsPageProps> = props => {
    const { hasWindowControls, isFullScreen, onClose } = props;

    const { version, build, environment, deviceInfo } = useAppContext();

    return (
        <AppLayout hasWindowControls={hasWindowControls} isFullScreen={isFullScreen}>
            <AppLayout.TitleBar className={dragRegionStyles} />

            <AppLayout.Sidebar>
                <List>
                    <List.Title>Dev tools</List.Title>

                    <List.Footer>
                        {`${build} ${version} · ${environment} · ${deviceInfo.osVersion}`}
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

                <div className={contentStyles}>
                    <KeychainSection />
                </div>
            </AppLayout.Content>
        </AppLayout>
    );
};
