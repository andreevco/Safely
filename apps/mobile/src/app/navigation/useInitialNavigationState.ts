import { hasPortfolioInStorage } from '@mobile/shared/storage/mmkv';

export function useInitialNavigationState() {
    if (hasPortfolioInStorage()) {
        return undefined;
    }

    return {
        routes: [{ name: 'WelcomeScreen' as const }]
    };
}
