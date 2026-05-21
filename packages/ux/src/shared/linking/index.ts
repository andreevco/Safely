import { LinkingFailedToOpenError, LinkingUnsafeProtocolError } from '@safely/core';
import type { Logger } from '@safely/sync';

export enum LinkingProtocol {
    HTTPS = 'https:',
    MAILTO = 'mailto:',
    SAFELY_SCHEME = 'safely:',
    TG_SCHEME = 'tg:'
}

export abstract class Linking {
    protected abstract readonly authorizedOpenUrlProtocols: LinkingProtocol[];

    protected abstract openWindow(url: string): Promise<void>;

    private isValidUrlProtocol(url: string, logger: Logger): boolean {
        try {
            const u = new URL(url);
            return this.authorizedOpenUrlProtocols.includes(u.protocol as LinkingProtocol);
        } catch (e) {
            logger.error('Invalid URL protocol', e);
            return false;
        }
    }

    public async openURL(url: string, logger: Logger): Promise<void> {
        if (!this.isValidUrlProtocol(url, logger)) {
            throw new LinkingUnsafeProtocolError();
        }

        try {
            await this.openWindow(url);
        } catch (e) {
            logger.error('Failed to open URL', e);
            throw new LinkingFailedToOpenError();
        }
    }
}
