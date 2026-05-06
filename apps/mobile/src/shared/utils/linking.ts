import { Linking as RNLinking } from 'react-native';

import { Linking } from '@safely/ux';

export class MobileAppLinking extends Linking {
    protected override authorizedOpenUrlProtocols: string[] = ['https:', 'mailto:', 'safely:'];
    protected override openWindow(url: string): void {
        void RNLinking.openURL(url);
    }
}
