import { byNameThenVersion, compareStrings } from '../shared/util.mjs';
import { decodeDigest, field, fields, parseTextProto } from './text-proto.mjs';

// Walks the edge list from every root, labelling each library it reaches. The
// roots are the app module's direct dependencies, which is the address of any fix.
function attribute(libraries, edges, roots) {
    const declaredBy = libraries.map(() => new Set());
    for (const root of roots) {
        const label = libraries[root]?.name;
        if (!label) continue;
        const queue = [root];
        const seen = new Set(queue);
        while (queue.length) {
            const index = queue.shift();
            declaredBy[index].add(label);
            for (const next of edges.get(index) ?? []) {
                if (seen.has(next)) continue;
                seen.add(next);
                queue.push(next);
            }
        }
    }
    return declaredBy;
}

// `android/app/build/outputs/sdk-dependencies/release/sdkDependencies.txt`, which
// the Android Gradle Plugin writes on every APK build. Position in the file *is*
// the identity: every edge is an index into the `library` list.
export function parseSdkDependencies(text) {
    const records = parseTextProto(text);

    const repositories = records
        .filter(record => record.name === 'repositories')
        .map(record => field(record, 'url'));

    const libraries = records
        .filter(record => record.name === 'library')
        .map(record => {
            const group = field(record, 'groupId');
            const artifact = field(record, 'artifactId');
            const repo = field(record, 'value');
            return {
                name: group && artifact ? `${group}:${artifact}` : null,
                version: field(record, 'version') ?? null,
                sha256: decodeDigest(field(record, 'sha256')),
                repository: repo === undefined ? null : (repositories[Number(repo)] ?? null)
            };
        });

    if (!libraries.length) throw new Error('sdkDependencies.txt holds no `library` records');

    const edges = new Map();
    for (const record of records.filter(record => record.name === 'library_dependencies')) {
        edges.set(
            Number(field(record, 'library_index')),
            fields(record, 'library_dep_index').map(Number)
        );
    }

    const roots = records
        .filter(record => record.name === 'module_dependencies')
        .flatMap(record => fields(record, 'dependency_index').map(Number));

    const declaredBy = attribute(libraries, edges, roots);

    return libraries
        .map((library, index) => ({
            name: library.name,
            version: library.version,
            // AGP writes this file for the release variant only, so everything in
            // it is in the shipped APK by construction.
            graph: 'runtime',
            declaredBy: [...declaredBy[index]].sort(compareStrings),
            sha256: library.sha256,
            repository: library.repository
        }))
        .filter(entry => entry.name && entry.version)
        .sort(byNameThenVersion);
}
