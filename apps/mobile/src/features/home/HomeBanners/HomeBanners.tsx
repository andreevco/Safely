import { View } from 'react-native';

import { useBootConfig, useLinking } from '@safely/ux';

import { Banner, InformationCircle28 } from '@mobile/shared/ui';

import { styles } from './HomeBanners.styles';

function getIcon(icon: string | undefined) {
    switch (icon) {
        case 'info':
            return InformationCircle28;
        default:
            return undefined;
    }
}

export function HomeBanners() {
    const { notices } = useBootConfig();
    const linking = useLinking();

    if (!notices) {
        return null;
    }

    return (
        <View style={styles.container}>
            {notices.home_screen_banners.map(banner => (
                <Banner
                    key={banner.id}
                    onPress={() => {
                        if (banner.banner_click_action_url) {
                            void linking.openURL(banner.banner_click_action_url);
                        }
                    }}
                    icon={getIcon(banner.icon)}
                    variant={banner.type === 'default' ? undefined : banner.type}
                    text={banner.text}
                    actionText={banner.action_button?.text}
                />
            ))}
        </View>
    );
}
