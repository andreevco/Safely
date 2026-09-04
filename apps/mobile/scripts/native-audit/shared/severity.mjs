export const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

export const isSeverity = value => typeof value === 'string' && value in SEVERITY_RANK;

// Sonatype reports a CVSS score rather than a severity label. The bands are CVSS
// v3's; a v2 vector — recognisable by having no `CVSS:` prefix, and still present
// on older records — has no `critical` band, so a v2 score can only ever land one
// band too high, never too low. An unscored advisory is not a harmless one, so it
// takes the strictest reading short of critical.
export function severityFromCvss(score) {
    if (!Number.isFinite(score) || score <= 0) return { severity: 'high', rated: false };
    if (score >= 9) return { severity: 'critical', rated: true };
    if (score >= 7) return { severity: 'high', rated: true };
    if (score >= 4) return { severity: 'moderate', rated: true };
    return { severity: 'low', rated: true };
}

export function countBySeverity(findings) {
    const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
    for (const finding of findings) if (finding.severity in counts) counts[finding.severity]++;
    return counts;
}

export const bySeverityThenName = (a, b) =>
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
