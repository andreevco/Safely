import { Linking as RNLinking } from 'react-native';

import { Linking, LinkingProtocol } from '@safely/ux';

export class MobileAppLinking extends Linking {
    protected override authorizedOpenUrlProtocols: LinkingProtocol[] = [
        LinkingProtocol.HTTPS,
        LinkingProtocol.MAILTO,
        LinkingProtocol.SAFELY_SCHEME
    ];
    protected override async openWindow(url: string): Promise<void> {
        await RNLinking.openURL(url);
    }
}
