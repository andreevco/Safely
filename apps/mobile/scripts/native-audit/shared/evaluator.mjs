import { SEVERITY_RANK } from './severity.mjs';
import { daysBetween } from './util.mjs';

export const KIND_LABEL = {
    unreviewed: 'NEW',
    expired: 'EXPIRED',
    'severity-increased': 'ESCALATED',
    'context-mismatch': 'CONTEXT',
    stale: 'STALE'
};

export class GateEvaluator {
    constructor(registry, { today = new Date() } = {}) {
        this.registry = registry;
        this.today = today;
    }

    evaluate(findings) {
        const violations = [];
        const warnings = [];
        const accepted = [];
        const informational = [];
        const matched = new Set();
        const push = (entry, blocking) => (blocking ? violations : warnings).push(entry);

        for (const finding of findings) {
            const { key, exception } = this.registry.find(finding);

            if (!exception) {
                // The declared collector distinguishes `test` from everything else
                // and nothing more, so an unreviewed runtime finding gets the
                // strictest threshold: `rn-dev`, `build` and `dev` are claims only
                // a reviewed entry can make.
                if (this.registry.blocks(finding.severity, finding.graph)) {
                    violations.push({
                        kind: 'unreviewed',
                        finding,
                        detail: 'no reviewed exception in the registry'
                    });
                } else {
                    informational.push({ finding });
                }
                continue;
            }

            matched.add(key);
            const daysLeft = daysBetween(this.today, new Date(exception.expires));
            const escalated = SEVERITY_RANK[finding.severity] > SEVERITY_RANK[exception.severity];
            // Every `graph` value is backed by a Gradle configuration name, so a
            // `dev` or `test` claim against a runtime one is a real contradiction,
            // not a guess.
            const contextMismatch =
                finding.graph === 'runtime' && ['dev', 'test'].includes(exception.context);

            if (daysLeft < 0) {
                violations.push({
                    kind: 'expired',
                    finding,
                    exception,
                    detail: `expired ${-daysLeft} day(s) ago (${exception.expires}), owner ${exception.owner}`
                });
            } else if (escalated) {
                push(
                    {
                        kind: 'severity-increased',
                        finding,
                        exception,
                        detail: `recorded as ${exception.severity}, now ${finding.severity}`
                    },
                    this.registry.blocks(finding.severity, exception.context)
                );
            } else if (contextMismatch) {
                push(
                    {
                        kind: 'context-mismatch',
                        finding,
                        exception,
                        detail: `recorded as ${exception.context}, but declared through a runtime configuration`
                    },
                    this.registry.blocks(finding.severity, 'runtime')
                );
            } else {
                accepted.push({ finding, exception });
            }
        }

        // An exception with nothing left to excuse is dead weight, and here it
        // usually means the coordinate moved with an SDK bump. Blocking, so it
        // gets dropped.
        for (const exception of this.registry.exceptions) {
            if (matched.has(this.registry.keyOfException(exception))) continue;
            violations.push({
                kind: 'stale',
                exception,
                detail: 'advisory is gone from the scanned graph — drop this entry'
            });
        }

        return { violations, warnings, accepted, informational };
    }
}
