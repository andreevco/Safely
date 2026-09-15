import type { SettingsSection } from './settings';

export const MAIN_MODALS = ['send', 'receive', 'addWallet', 'addAccount'] as const;

export type MainModal = (typeof MAIN_MODALS)[number];

export type MainView =
    | { kind: 'home' }
    | { kind: 'updates' }
    | { kind: 'safety' }
    | { kind: 'settings'; section: SettingsSection | null };

export type MainLocation = {
    view: MainView;
    modal: MainModal | null;
};
