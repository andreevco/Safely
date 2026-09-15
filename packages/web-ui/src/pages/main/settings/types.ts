export const SETTINGS_SECTIONS = [
    'wallet',
    'account',
    'addressBook',
    'security',
    'language',
    'currency',
    'legal'
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
