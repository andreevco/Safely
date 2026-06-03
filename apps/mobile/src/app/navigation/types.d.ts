import type { RootStack } from './index';

type RootStackType = typeof RootStack;

declare module '@react-navigation/core' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootNavigator extends RootStackType {}
}
