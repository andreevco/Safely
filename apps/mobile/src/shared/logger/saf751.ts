import { AppState, Platform } from 'react-native';

import type { Logger } from '@safely/sync';
import { installSaf751Trace, saf751 } from '@safely/sync';

type HermesStats = { HermesInternal?: { getInstrumentedStats?: () => Record<string, number> } };

const bootAt = Date.now();
const sessionId = Math.random().toString(36).slice(2, 8);

let seq = 0;
let prevAt = bootAt;

const toMb = (bytes: number | undefined) =>
    typeof bytes === 'number' ? Math.round(bytes / 1024 / 1024) : undefined;

const heap = () => {
    try {
        const stats = (globalThis as HermesStats).HermesInternal?.getInstrumentedStats?.();
        if (!stats) return undefined;

        return {
            allocMb: toMb(stats.js_allocatedBytes),
            heapMb: toMb(stats.js_heapSize),
            mallocMb: toMb(stats.js_mallocSizeEstimate),
            vaMb: toMb(stats.js_vaSize),
            gc: stats.js_numGCs
        };
    } catch {
        return undefined;
    }
};

export function installSaf751Tracing(rootLogger: Logger): void {
    const traceLogger = rootLogger.child('saf751');

    installSaf751Trace((step, data) => {
        const now = Date.now();
        const entry = {
            s: step,
            n: ++seq,
            ms: now - bootAt,
            dt: now - prevAt,
            mem: heap(),
            ...data
        };
        prevAt = now;
        traceLogger.warn(entry);
    });

    saf751('boot', {
        sessionId,
        platform: Platform.OS,
        osVersion: String(Platform.Version),
        appState: AppState.currentState
    });

    AppState.addEventListener('change', state => saf751('appState', { state }));
    AppState.addEventListener('memoryWarning', () => saf751('memoryWarning'));
    AppState.addEventListener('blur', () => saf751('appBlur'));
    AppState.addEventListener('focus', () => saf751('appFocus'));
}
