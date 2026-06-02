/**
 * Stable selectors for e2e (Maestro) tests.
 *
 * Keep values in sync with the flows under `apps/mobile/.maestro`.
 * Prefer testID over text matchers in flows — the app is localized (en/ru),
 * so matching by visible text is locale-fragile.
 */
export const TEST_ID = {
    welcome: {
        createWallet: 'welcome.createWallet',
        importWallet: 'welcome.importWallet'
    },
    biometry: {
        skip: 'biometry.skip'
    },
    accountCreated: {
        protectLater: 'accountCreated.protectLater',
        addDevice: 'accountCreated.addDevice'
    },
    home: {
        settingsButton: 'home.settingsButton'
    }
} as const;
