import { useTranslation } from 'react-i18next';

import type { SyncedDeviceDetails } from '@safely/ux';
import { useHideDeviceWarning } from '@safely/ux';

import { Banner, Button } from '@mobile/shared/ui';

import { styles } from './StaleWarningBanner.styles';

type StaleWarningBannerProps = {
    details: SyncedDeviceDetails;
};

export const StaleWarningBanner = ({ details }: StaleWarningBannerProps) => {
    const { t } = useTranslation();
    const { mutate: hideWarning } = useHideDeviceWarning();

    const handleHide = () => hideWarning(details.ikPubHex);

    return (
        <Banner variant="warn" nonInteractive style={styles.banner}>
            <Banner.Content>
                <Banner.Text>
                    {t('security.deviceDetails.staleWarning', { deviceName: details.meta.name })}
                </Banner.Text>
            </Banner.Content>
            <Button type="warning" size="small" style={styles.hideButton} onPress={handleHide}>
                {t('security.deviceDetails.hideWarning')}
            </Button>
        </Banner>
    );
};
