import { Linking as RNLinking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';

import { Linking, LinkingProtocol } from '@safely/ux';

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
        if (!InAppBrowser.isAvailable()) {
            await this.openExternal(url);
            return;
        }

        await InAppBrowser.open(url, {
            ephemeralWebSession: false,
            showTitle: false,
            showInRecents: true,
            enableUrlBarHiding: true,
            forceCloseOnRedirection: true,
            animated: false,
            modalPresentationStyle: 'overFullScreen',
            modalTransitionStyle: 'coverVertical'
        });
    }
}
