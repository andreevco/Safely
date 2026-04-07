const { version } = require('./package.json');

module.exports = {
    expo: {
        name: 'Safely',
        slug: 'swallet',
        version,
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        newArchEnabled: true,
        scheme: 'aco-swalet',
        ios: {
            infoPlist: {
                UIDesignRequiresCompatibility: true,
                NSFaceIDUsageDescription:
                    'We use Face ID to unlock your wallet securely.',
                CFBundleLocalizations: ['en', 'ru'],
                ITSAppUsesNonExemptEncryption: false
            },
            supportsTablet: true,
            bundleIdentifier: 'com.aco.swallet',
            appleTeamId: '9N49283836'
        },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundImage: './assets/android-icon-bg.png'
            },
            package: 'com.aco.swallet'
        },
        plugins: [
            [
                'react-native-vision-camera',
                {
                    cameraPermissionText:
                        '$(PRODUCT_NAME) needs access to your Camera.',
                    enableLocation: false
                }
            ],
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
            './plugins/withSplashScreenBG',
            [
                'expo-splash-screen',
                {
                    image: './assets/splash-icon.png'
                }
            ],
            [
                'expo-notifications',
                {
                    icon: './assets/icon.png'
                }
            ]
        ],
        extra: {
            eas: {
                projectId: '2987418a-1c20-4389-9796-485f4e37c78a'
            }
        },
        owner: 'acom'
    }
};