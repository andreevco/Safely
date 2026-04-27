import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Logger } from '@safely/sync';

import { ACCOUNT_FILE_PATTERN } from './naming';

export async function shareAggregatedLogs(opts: {
    systemFilename: string;
    logger: Logger;
}): Promise<void> {
    const aggregate = new File(Paths.cache, `safely-logs-${Date.now()}.ndjson`);
    try {
        aggregate.create();
        aggregate.write(section('system'));
        appendFileIfExists(aggregate, opts.systemFilename, opts.logger);

        let files: string[] = [];
        try {
            files = new Directory(Paths.document).list().map(item => item.name);
        } catch {
            // directory may not exist
        }

        for (const name of files.filter(n => ACCOUNT_FILE_PATTERN.test(n))) {
            const match = ACCOUNT_FILE_PATTERN.exec(name);
            if (!match) continue;

            appendText(aggregate, section(`account-${match[1]}`));
            appendFileIfExists(aggregate, name, opts.logger);
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
        const source = new File(Paths.document, filename);
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
