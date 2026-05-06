import { useCallback } from 'react';
import { View } from 'react-native';

import { BootConfig } from '@safely/core';
import {
    useBootConfig,
    useDismissBanner,
    useDismissedBannerIdsQuery,
    useLinking
} from '@safely/ux';

import { Banner, Xmark16 } from '@mobile/shared/ui';
import { IconProps } from '@mobile/shared/ui/Icon';

import { styles } from './HomeBanners.styles';

type HomeScreenBanner = NonNullable<BootConfig['notices']>['home_screen_banners'][number];

const DISMISS_ICON = 'info';

const BANNER_ICONS: Record<string, IconProps['icon']> = {
    [DISMISS_ICON]: Xmark16
};

export function HomeBanners() {
    const { notices } = useBootConfig();
    const { data: dismissedIds } = useDismissedBannerIdsQuery();

    const dismissed = new Set(dismissedIds ?? []);
    const visible = notices.home_screen_banners.filter(b => !dismissed.has(b.id));

    if (visible.length === 0) {
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
    banner: HomeScreenBanner;
};

function BannerItem({ banner }: BannerItemProps) {
    const linking = useLinking();
    const { mutate: dismissBanner } = useDismissBanner();

    const isDismissible = banner.icon === DISMISS_ICON;
    const iconComponent = banner.icon ? BANNER_ICONS[banner.icon] : undefined;

    const handlePress = useCallback(() => {
        if (banner.banner_click_action_url) {
            void linking.openURL(banner.banner_click_action_url);
        }
    }, [banner.banner_click_action_url, linking]);

    const handleActionPress = useCallback(() => {
        if (banner.action_button?.url) {
            void linking.openURL(banner.action_button.url);
        }
    }, [banner.action_button?.url, linking]);

    const handleDismiss = useCallback(() => {
        dismissBanner(banner.id);
    }, [banner.id, dismissBanner]);

    return (
        <Banner
            variant={banner.type === 'default' ? undefined : banner.type}
            onPress={banner.banner_click_action_url ? handlePress : undefined}
        >
            <Banner.Content alignItems={isDismissible ? 'start' : 'center'}>
                <Banner.Text>{banner.text}</Banner.Text>
                {iconComponent && (
                    <Banner.Icon
                        icon={iconComponent}
                        onPress={isDismissible ? handleDismiss : undefined}
                    />
                )}
            </Banner.Content>
            {banner.action_button && (
                <Banner.Action onPress={handleActionPress}>
                    {banner.action_button.text}
                </Banner.Action>
            )}
        </Banner>
    );
}
