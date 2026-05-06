import { Logger } from '@safely/sync';

export enum LinkingProtocol {
    HTTPS = 'https:',
    MAILTO = 'mailto:',
    SAFELY_SCHEME = 'safely:',
    TG_SCHEME = 'tg:'
}

export abstract class Linking {
    constructor(protected readonly logger: Logger) {}
    protected abstract readonly authorizedOpenUrlProtocols: LinkingProtocol[];

    protected abstract openWindow(url: string): void;

    private isValidUrlProtocol(url: string): boolean {
        try {
            const u = new URL(url);
            return this.authorizedOpenUrlProtocols.includes(u.protocol as LinkingProtocol);
        } catch (e) {
            this.logger.error('Invalid URL protocol', e);
            return false;
        }
    }

    public openURL(url: string): void {
        if (!this.isValidUrlProtocol(url)) {
            throw new Error('Unsafe protocol');
        }

        try {
            this.openWindow(url);
        } catch (e) {
            this.logger.error('Failed to open URL', e);
        }
    }
}
