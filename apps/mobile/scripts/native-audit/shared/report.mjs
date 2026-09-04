import { KIND_LABEL } from './evaluator.mjs';

// A resolved graph reaches a widely shared library through dozens of paths, and
// listing all of them buries the ones that matter. The first few place it; the
// rest are in the graph file.
export const reachedThrough = (paths = []) =>
    paths.slice(0, 4).join(', ') + (paths.length > 4 ? `, +${paths.length - 4} more` : '');

export class GateReport {
    constructor({ mode, coordinates, pods, ios, build, unknownPods, result, counts, findingCount }) {
        this.mode = mode;
        this.coordinates = coordinates;
        this.pods = pods;
        this.ios = ios;
        this.build = build;
        this.unknownPods = unknownPods ?? [];
        this.result = result;
        this.counts = counts;
        this.findingCount = findingCount;
    }

    get queryablePods() {
        return this.pods.filter(pod => pod.queryable);
    }

    get scannedLabel() {
        return (
            `${this.coordinates.length} ${this.mode} coordinate(s)` +
            (this.queryablePods.length ? ` + ${this.queryablePods.length} pod(s)` : '')
        );
    }

    // No brackets, backticks, quotes or dollars anywhere in the summary: it
    // travels through EAS Workflows' `set-output` into its own bash, which does
    // not quote-safely interpolate any of them.
    get scannedPlain() {
        return (
            `${this.coordinates.length} ${this.mode} coordinates` +
            (this.queryablePods.length ? ` + ${this.queryablePods.length} pods` : '')
        );
    }

    toSummaryLine() {
        const { violations, warnings } = this.result;
        if (violations.length)
            return `❌ ${violations.length} blocking, ${warnings.length} to review · ${this.scannedPlain}`;
        if (warnings.length)
            return `⚠️ ${warnings.length} to review, none blocking · ${this.scannedPlain}`;
        return `✅ clean · ${this.scannedPlain}`;
    }

    toConsoleLines() {
        const { violations, warnings, accepted, informational } = this.result;
        const lines = [
            `${this.scannedLabel}, ${this.findingCount} advisory record(s) — ` +
                `${this.counts.critical} critical, ${this.counts.high} high, ` +
                `${this.counts.moderate} moderate, ${this.counts.low} low`
        ];
        for (const entry of [...violations, ...warnings]) {
            const source = entry.finding ?? entry.exception;
            const coordinate = `${source.name ?? source.package}@${source.version ?? '?'}`;
            lines.push(
                `  [${KIND_LABEL[entry.kind]}] ${source.severity} ${coordinate} ${source.id} — ${entry.detail}`
            );
        }
        lines.push(`  ${accepted.length} accepted, ${informational.length} non-blocking`);
        return lines;
    }

    #table(entries) {
        return [
            '| Verdict | Severity | Package | Advisory | Graph | Reached through | Detail |',
            '| --- | --- | --- | --- | --- | --- | --- |',
            ...entries.map(entry => {
                const source = entry.finding ?? entry.exception;
                const through = entry.finding?.declaredBy ?? entry.exception?.declaredBy ?? [];
                const cells = [
                    KIND_LABEL[entry.kind],
                    source.severity ?? '',
                    `\`${source.name ?? source.package ?? ''}@${source.version ?? '?'}\``,
                    entry.finding?.url ? `[${source.id}](${entry.finding.url})` : (source.id ?? ''),
                    entry.finding?.graph ?? entry.exception?.context ?? '—',
                    reachedThrough(through) || '—',
                    entry.detail
                ];
                return `| ${cells.join(' | ')} |`;
            }),
            ''
        ];
    }

    toMarkdown() {
        const { result, counts, build, pods, ios, unknownPods } = this;
        const lines = ['## Native dependency advisories', ''];

        if (build) {
            lines.push(
                `Resolved by EAS build \`${build.id}\` (${build.platform}, profile \`${build.profile}\`, ` +
                    `v${build.appVersion} build ${build.appBuildVersion}, commit \`${(build.gitCommitHash ?? '').slice(0, 8)}\`).`,
                ''
            );
        }

        const subjects = [`${this.coordinates.length} ${this.mode} Maven coordinate(s)`];
        if (pods.length)
            subjects.push(
                `${pods.length} installed pod(s), ${this.queryablePods.length} of them in a database`
            );

        lines.push(
            `**${subjects.join(' · ')}** — ` +
                `${counts.critical} critical · ${counts.high} high · ${counts.moderate} moderate · ${counts.low} low. ` +
                `${result.accepted.length} accepted by the registry, ${result.violations.length} blocking, ` +
                `${result.warnings.length} to review.`,
            ''
        );

        if (result.violations.length)
            lines.push('### Blocking', '', ...this.#table(result.violations));
        if (result.warnings.length)
            lines.push('### Needs attention', '', ...this.#table(result.warnings));

        if (result.informational.length) {
            lines.push(
                `<details><summary>${result.informational.length} non-blocking advisory record(s)</summary>`,
                '',
                ...result.informational.map(
                    ({ finding }) =>
                        `- ${finding.severity} · \`${finding.name}@${finding.version}\` · ${finding.id} · ${finding.graph}`
                ),
                '',
                '</details>',
                ''
            );
        }

        if (!result.violations.length && !result.warnings.length)
            lines.push('✅ No blocking advisories and nothing awaiting review.', '');

        // A pod the database has never heard of is not a pod with no advisories,
        // and the two are indistinguishable in a clean report unless it says so.
        if (unknownPods.length) {
            lines.push(
                `⚠️ ${unknownPods.length} pod(s) Sonatype does not know at all — their empty result ` +
                    'says nothing: ' +
                    unknownPods.map(pod => `\`${pod}\``).join(', '),
                ''
            );
        }

        if (pods.length) {
            const opaque = pods.filter(pod => !pod.queryable);
            lines.push(
                `<details><summary>${opaque.length} pod(s) no database can answer about</summary>`,
                '',
                'Every one of these is a `:path` pod versioned by the npm package that ships it, so no',
                'record keyed by pod and version can exist. See .claude/rules/dependency-security.md.',
                '',
                ...opaque.map(pod => `- \`${pod.name}\` ${pod.version}`),
                '',
                '</details>',
                ''
            );
        }

        if (ios.length) {
            lines.push(
                `<details><summary>iOS inventory — ${ios.length} vendored dependenc(ies), reported not gated</summary>`,
                '',
                'This run had no resolved pod graph, so these are the versions vendored in the installed',
                'tree, not the ones a build resolved. See .claude/rules/dependency-security.md.',
                '',
                ...ios.map(entry => `- \`${entry.name}\` ${entry.version}`),
                '',
                '</details>',
                ''
            );
        }

        return lines.join('\n');
    }

    static failure(message) {
        return `## Native dependency advisories\n\n❌ Scan failed — ${message}\n`;
    }
}
