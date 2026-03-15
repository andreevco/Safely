import { FC, useEffect } from 'react';
import { AppState } from 'react-native';

import { useHasAccount, useReportDeviceMeta } from '@safely/ux';

const DeviceMetaReporterInner: FC = () => {
    const { mutateAsync: reportDeviceMeta } = useReportDeviceMeta();

    useEffect(() => {
        reportDeviceMeta().catch(console.error);

        const subscription = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') {
                reportDeviceMeta().catch(console.error);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [reportDeviceMeta]);

    return null;
};

export const DeviceMetaReporter: FC = () => {
    const hasAccount = useHasAccount();

    if (!hasAccount) {
        return null;
    }

    return <DeviceMetaReporterInner />;
};
