import { Logger } from '@safely/sync';

export class Linking {
    constructor(protected readonly logger: Logger) {}
    protected readonly authorizedOpenUrlProtocols: string[] = ['https:', 'mailto:'];

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

    protected openWindow(url: string): void {
        window.open(url, '_blank', 'noreferrer,noopener');
    }

    private isValidUrlProtocol(url: string): boolean {
        try {
            const u = new URL(url);
            return this.authorizedOpenUrlProtocols.includes(u.protocol);
        } catch (e) {
            this.logger.error('Invalid URL protocol', e);
            return false;
        }
    }
}
