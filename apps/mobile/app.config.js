const { version } = require('./package.json');

module.exports = {
    expo: {
        name: 'Safely',
        slug: 'safely',
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
            bundleIdentifier: 'com.safely.wallet',
            appleTeamId: '3ZVCUSJU6R'
        },
        android: {
            permissions: ["android.permission.CAMERA"],
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundImage: './assets/android-icon-bg.png'
            },
            package: 'com.safely.wallet',
            allowBackup: false
        },
        plugins: [
            'expo-image',
            'expo-sharing',
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
            [
                'react-native-ble-plx',
                {
                    bluetoothAlwaysPermission:
                        '$(PRODТUCT_NAME) needs access to Bluetooth to connect to your Ledger hardware wallet.'
                }
            ],
            './plugins/withMMKVNoBackup'
        ],
        extra: {
            eas: {
                projectId: 'ba0507d3-f22e-49b9-8925-aa436d193658'
            }
        },
        owner: 'treadsafely'
    }
};
