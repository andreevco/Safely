import './global-polyfills';

import '@mobile/shared/i18n';
import '@mobile/shared/unistyles';

import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

import { App } from '@mobile/app';

SplashScreen.preventAutoHideAsync();

registerRootComponent(App);
