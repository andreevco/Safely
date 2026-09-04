import { SEVERITY_RANK } from '../shared/severity.mjs';
import { compareStrings } from '../shared/util.mjs';

const BATCH_URL = 'https://api.osv.dev/v1/querybatch';
const VULN_URL = 'https://api.osv.dev/v1/vulns';

// Maven advisories. No authentication, no rate limit worth pacing for, and the
// only ecosystem of the two that a public database covers.
export class OsvClient {
    constructor(http) {
        this.http = http;
    }

    // The batch endpoint answers with ids only, so severity needs a second call
    // per advisory.
    async query(coordinates) {
        const batch = await this.http.withRetries('osv querybatch', () =>
            this.http.postJson(BATCH_URL, {
                queries: coordinates.map(entry => ({
                    package: { name: entry.name, ecosystem: 'Maven' },
                    version: entry.version
                }))
            })
        );

        const snapshot = {};
        const ids = new Set();
        (batch.results ?? []).forEach((result, index) => {
            const hits = (result.vulns ?? []).map(vuln => vuln.id);
            if (!hits.length) return;
            snapshot[`${coordinates[index].name}@${coordinates[index].version}`] = hits;
            for (const id of hits) ids.add(id);
        });

        const details = {};
        for (const id of [...ids].sort(compareStrings)) details[id] = await this.#detailsOf(id);
        return { snapshot, details };
    }

    async #detailsOf(id) {
        const record = await this.http.withRetries(`osv vulns/${id}`, () =>
            this.http.getJson(`${VULN_URL}/${id}`)
        );
        const published = record.database_specific?.severity;
        const severity = typeof published === 'string' ? published.toLowerCase() : null;
        return {
            // An advisory without a published severity is not a harmless one.
            severity: severity in SEVERITY_RANK ? severity : 'high',
            rated: Boolean(severity && severity in SEVERITY_RANK),
            summary: record.summary ?? '',
            // The same advisory carries a GHSA id here and a CVE id in Sonatype,
            // so an exception recorded against either has to keep matching.
            aliases: record.aliases ?? [],
            url:
                record.references?.find(reference => reference.type === 'ADVISORY')?.url ??
                `https://osv.dev/vulnerability/${id}`
        };
    }
}
