import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Logger } from '@safely/sync';

export async function shareAggregatedLogs(opts: {
    logger: Logger;
    systemFilename: string;
    accountFilename: string | undefined;
}): Promise<void> {
    const aggregate = new File(Paths.cache, `safely-logs-${Date.now()}.ndjson`);
    try {
        aggregate.create();
        aggregate.write(section('system'));
        appendFileIfExists(aggregate, opts.systemFilename, opts.logger);

        if (opts.accountFilename) {
            appendText(aggregate, section('account'));
            appendFileIfExists(aggregate, opts.accountFilename, opts.logger);
        }

        await Sharing.shareAsync(aggregate.uri, {
            mimeType: 'application/x-ndjson',
            dialogTitle: 'Share Safely Logs'
        });
    } catch (e) {
        opts.logger.error('[shareAggregatedLogs] failed', e);
    }
}

function section(name: string): string {
    return JSON.stringify({ _section: name, t: new Date().toISOString() }) + '\n';
}

function appendText(target: File, text: string): void {
    const handle = target.open();
    handle.offset = target.size;
    handle.writeBytes(new TextEncoder().encode(text));
    handle.close();
}

function appendFileIfExists(target: File, filename: string, logger: Logger): void {
    try {
        const source = new File(Paths.cache, filename);
        if (!source.exists) return;

        const bytes = source.bytesSync();
        const handle = target.open();
        handle.offset = target.size;
        handle.writeBytes(bytes);
        handle.close();
    } catch (e) {
        logger.error('[shareAggregatedLogs] appendFile failed', filename, e);
    }
}
