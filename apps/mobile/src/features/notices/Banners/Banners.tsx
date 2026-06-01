import { useMemo } from 'react';
import { View } from 'react-native';

import type { BootConfig } from '@safely/core';
import {
    useBootConfig,
    useDismissBanner,
    useDismissedBannerIdsQuery,
    useLinking
} from '@safely/ux';

import { Banner, InformationCircle28, Xmark16 } from '@mobile/shared/ui';
import type { IconProps } from '@mobile/shared/ui/Icon';

import { styles } from './Banners.styles';

type NoticeBanner = NonNullable<BootConfig['notices']>['home_screen_banners'][number];

const DISMISS_ICON = 'dismiss';

const BANNER_ICONS: Record<string, IconProps['icon']> = {
    info: InformationCircle28,
    [DISMISS_ICON]: Xmark16
};

export function Banners() {
    const { notices } = useBootConfig();
    const { data: dismissedIds, isLoading } = useDismissedBannerIdsQuery();

    const dismissed = new Set(dismissedIds ?? []);
    const visible = notices.home_screen_banners.filter(b => !dismissed.has(b.id));

    if (isLoading || visible.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {visible.map(banner => (
                <BannerItem key={banner.id} banner={banner} />
            ))}
        </View>
    );
}

type BannerItemProps = {
    banner: NoticeBanner;
};

function BannerItem({ banner }: BannerItemProps) {
    const linking = useLinking();
    const { mutate: dismissBanner } = useDismissBanner();

    const isDismissible = banner.icon === DISMISS_ICON;
    const iconComponent = banner.icon ? BANNER_ICONS[banner.icon] : undefined;

    const clickUrl = banner.banner_click_action_url;
    const actionUrl = banner.action_button?.url;

    const handlePress = useMemo(() => {
        if (!clickUrl) {
            return undefined;
        }
        return () => {
            void linking.openURL(clickUrl);
        };
    }, [clickUrl, linking]);

    const handleActionPress = useMemo(() => {
        if (!actionUrl) {
            return undefined;
        }
        return () => {
            void linking.openURL(actionUrl);
        };
    }, [actionUrl, linking]);

    const handleDismiss = useMemo(() => {
        if (!isDismissible) {
            return undefined;
        }
        return () => {
            dismissBanner(banner.id);
        };
    }, [banner.id, dismissBanner, isDismissible]);

    return (
        <Banner variant={banner.type === 'default' ? undefined : banner.type} onPress={handlePress}>
            <Banner.Content alignItems={isDismissible ? 'start' : 'center'}>
                <Banner.Text>{banner.text}</Banner.Text>
                {iconComponent && <Banner.Icon icon={iconComponent} onPress={handleDismiss} />}
            </Banner.Content>
            {banner.action_button && (
                <Banner.Action onPress={handleActionPress}>
                    {banner.action_button.text}
                </Banner.Action>
            )}
        </Banner>
    );
}
