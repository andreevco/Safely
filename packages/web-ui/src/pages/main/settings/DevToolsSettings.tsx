import type { FC } from 'react';

import { useAppContext } from '@safely/ux';

import { buildStyles, contentStyles } from './DevToolsSettings.styles';
import { KeychainSection } from './KeychainSection';
import { PageHeader, Text } from '../../../shared';

export const DevToolsSettings: FC = () => {
    const { version, build, environment, deviceInfo } = useAppContext();

    return (
        <>
            <PageHeader title="Dev tools" hasDivider />

            <div className={contentStyles}>
                <Text variant="bodyM" tone="tertiary" className={buildStyles}>
                    {`${build} ${version} · ${environment} · ${deviceInfo.osVersion}`}
                </Text>

                <KeychainSection />
            </div>
        </>
    );
};
