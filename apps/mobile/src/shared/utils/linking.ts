import { Linking as RNLinking } from 'react-native';

import { Linking, LinkingProtocol } from '@safely/ux';

export class MobileAppLinking extends Linking {
    protected override authorizedOpenUrlProtocols: LinkingProtocol[] = [
        LinkingProtocol.HTTPS,
        LinkingProtocol.MAILTO,
        LinkingProtocol.SAFELY_SCHEME
    ];
    protected override openWindow(url: string): void {
        void RNLinking.openURL(url);
    }
}
