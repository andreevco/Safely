import { isIsoDate, readJsonFile } from './util.mjs';
import { SEVERITY_RANK } from './severity.mjs';

export const VALID_CONTEXTS = ['runtime', 'rn-dev', 'build', 'dev', 'test'];
export const VALID_PATCHABLE = ['repo', 'resolutionStrategy', 'rn-upgrade', 'podfile'];
export const VALID_ECOSYSTEMS = ['Maven', 'CocoaPods'];

// The threshold is a function of context, unlike the JavaScript gate. Measured
// reason: the high-severity findings in the declared graph sit in LogBox's
// development UI and in a test assertion library, while the two that ship inside
// the wallet's file-system path are moderate. A single global threshold gets that
// backwards. Overridable from the registry's own `policy` block, so tightening the
// gate is a reviewable diff there rather than a code change.
const DEFAULT_POLICY = {
    blockingSeverities: {
        runtime: ['critical', 'high', 'moderate'],
        'rn-dev': ['critical', 'high'],
        build: ['critical', 'high'],
        dev: ['critical'],
        test: ['critical']
    }
};

const normalizeId = value => (typeof value === 'string' ? value.trim().toUpperCase() : '');

const keyOf = (id, packageName) => `${normalizeId(id)}|${packageName}`;

export class AdvisoryRegistry {
    static load(path) {
        const parsed = readJsonFile(path, 'registry');
        return new AdvisoryRegistry(parsed);
    }

    constructor(raw = {}) {
        this.exceptions = raw.exceptions ?? [];
        this.policy = {
            ...DEFAULT_POLICY,
            ...(raw.policy ?? {}),
            blockingSeverities: {
                ...DEFAULT_POLICY.blockingSeverities,
                ...(raw.policy?.blockingSeverities ?? {})
            }
        };
        this.byKey = new Map(
            this.exceptions.map(exception => [keyOf(exception.id, exception.package), exception])
        );
    }

    validate() {
        const errors = [];
        const seen = new Set();

        this.exceptions.forEach((exception, index) => {
            const where = `exceptions[${index}]${exception.id ? ` (${exception.id})` : ''}`;
            const check = (field, ok, message) => {
                if (!ok) errors.push(`${where}: ${field} ${message}`);
            };
            const filled = field =>
                typeof exception[field] === 'string' && exception[field].trim().length > 0;

            // An exception is keyed by advisory *and* coordinate: the same GHSA can
            // reach the graph through two artifacts that need separate arguments.
            const key = keyOf(exception.id, `${exception.package}@${exception.version ?? '*'}`);
            check('id', normalizeId(exception.id).length > 0, 'is required');
            check('id', !seen.has(key), 'is listed twice for the same coordinate');
            seen.add(key);

            const ecosystem = exception.ecosystem ?? 'Maven';
            check(
                'ecosystem',
                VALID_ECOSYSTEMS.includes(ecosystem),
                `must be one of ${VALID_ECOSYSTEMS.join(', ')}`
            );
            check(
                'package',
                filled('package') && (ecosystem !== 'Maven' || exception.package.includes(':')),
                ecosystem === 'Maven' ? 'must be a group:artifact coordinate' : 'must be a pod name'
            );
            check('severity', exception.severity in SEVERITY_RANK, 'must be a known severity');
            check(
                'context',
                VALID_CONTEXTS.includes(exception.context),
                `must be one of ${VALID_CONTEXTS.join(', ')}`
            );
            check(
                'patchable',
                exception.patchable === undefined ||
                    VALID_PATCHABLE.includes(exception.patchable),
                `must be one of ${VALID_PATCHABLE.join(', ')}`
            );
            check('rationale', filled('rationale'), 'is required');
            check('owner', filled('owner'), 'is required');
            check('expires', isIsoDate(exception.expires), 'must be a YYYY-MM-DD date');
        });

        return errors;
    }

    // No exception means no reviewed context, so the strictest one applies.
    blocks(severity, context) {
        const { blockingSeverities } = this.policy;
        return (blockingSeverities[context] ?? blockingSeverities.runtime).includes(severity);
    }

    // OSV keys the same advisory by GHSA and Sonatype by CVE, so an exception is
    // looked up by the finding's id *or* any of its aliases.
    find(finding) {
        const keys = [finding.id, ...(finding.aliases ?? [])].map(id => keyOf(id, finding.name));
        const key = keys.find(candidate => this.byKey.has(candidate)) ?? keys[0];
        return { key, exception: this.byKey.get(key) };
    }

    keyOfException(exception) {
        return keyOf(exception.id, exception.package);
    }
}
