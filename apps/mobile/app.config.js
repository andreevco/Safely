const { version } = require('./package.json');

module.exports = {
    expo: {
        name: 'Safely',
        slug: 'swallet',
        version,
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        scheme: 'safely',
        ios: {
            infoPlist: {
                UIDesignRequiresCompatibility: true,
                NSFaceIDUsageDescription:
                    'We use Face ID to unlock your wallet securely.',
                NSCameraUsageDescription:
                    '$(PRODUCT_NAME) needs access to your Camera.',
                CFBundleLocalizations: ['en', 'ru'],
                ITSAppUsesNonExemptEncryption: false
            },
            supportsTablet: true,
            /*
                https://developer.apple.com/documentation/BundleResources/Information-Property-List/UIRequiresFullScreen
                TODO: SAF-408
                we should prepare interface for resizing
                We force fullScreen because of known (slider) and unknown issues at this moment
                It's better to double-check app on ARM Macs and iPads before public release 
            */
            requireFullScreen: true,
            bundleIdentifier: 'com.aco.swallet',
            appleTeamId: '9N49283836'
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundImage: './assets/android-icon-bg.png'
            },
            package: 'com.aco.swallet',
            allowBackup: false
        },
        plugins: [
            [
                'expo-localization',
                {
                    supportedLocales: {
                        ios: ['en', 'ru'],
                        android: ['en', 'ru']
                    }
                }
            ],
            'react-native-bottom-tabs',
            'expo-asset',
            [
                'expo-splash-screen',
                {
                    image: './assets/splash-icon.png',
                    backgroundColor: "#0C0C0D"
                }
            ],
            [
                'expo-notifications',
                {
                    icon: './assets/icon.png'
                }
            ],
            './plugins/withMMKVNoBackup'
        ],
        extra: {
            eas: {
                projectId: '2987418a-1c20-4389-9796-485f4e37c78a'
            }
        },
        owner: 'acom'
    }
};
