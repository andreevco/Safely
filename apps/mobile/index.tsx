import '@mobile/shared/i18n';
import '@mobile/shared/unistyles';

import { App } from '@mobile/app';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

registerRootComponent(App);
