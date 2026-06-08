import { Linking as RNLinking } from 'react-native';

import { Linking, LinkingProtocol } from '@safely/ux';

import { isAvailable, openBrowser } from '../../../modules/safely-in-app-browser/src';

export class MobileAppLinking extends Linking {
    protected override authorizedOpenUrlProtocols: LinkingProtocol[] = [
        LinkingProtocol.HTTPS,
        LinkingProtocol.MAILTO,
        LinkingProtocol.SAFELY_SCHEME
    ];

    protected async openExternal(url: string): Promise<void> {
        await RNLinking.openURL(url);
    }

    protected async openInApp(url: string): Promise<void> {
        if (!isAvailable()) {
            await this.openExternal(url);
            return;
        }

        await openBrowser(url);
    }
}
