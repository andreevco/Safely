import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { pnpmPackages, reactNativeDirs } from '../shared/installed-tree.mjs';
import { byNameThenVersion, compareStrings, readDirs } from '../shared/util.mjs';

// `implementation`/`api`/`compileOnly` put the artifact in the shipped APK;
// `test*` does not. This is the native counterpart of `dev: false` in
// `pnpm audit`, and the only hard signal this collector has.
const COORDINATE =
    /(implementation|api|compileOnly|runtimeOnly|testImplementation|androidTestImplementation|testRuntimeOnly)[\s(]*["']([a-z][a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+:[0-9][0-9A-Za-z._-]*)["']/g;

// Reads the Maven coordinates *declared* in the installed tree, with no JDK, no
// Android SDK and no `expo prebuild` — at the cost of missing transitive
// dependencies and of reporting versions that lose a conflict resolution and
// never ship. The resolved graph from a build is the authoritative record.
export class DeclaredCoordinateCollector {
    constructor(repoRoot) {
        this.repoRoot = repoRoot;
        this.found = new Map();
    }

    collect() {
        this.found = new Map();
        this.#collectRepoModules();
        this.#collectNpmPackages();
        this.#collectVersionCatalog();

        return [...this.found.values()]
            .map(entry => ({ ...entry, declaredBy: [...entry.declaredBy].sort(compareStrings) }))
            .sort(byNameThenVersion);
    }

    #add(entry) {
        const key = `${entry.name}@${entry.version}`;
        const existing = this.found.get(key);
        if (!existing) {
            this.found.set(key, { ...entry, declaredBy: new Set([entry.declaredBy]) });
            return;
        }
        existing.declaredBy.add(entry.declaredBy);
        // Declared through a runtime configuration anywhere means it ships.
        if (entry.graph === 'runtime') existing.graph = 'runtime';
    }

    #scanGradleFile(file, declaredBy) {
        for (const match of readFileSync(file, 'utf8').matchAll(COORDINATE)) {
            const [group, artifact, version] = match[2].split(':');
            this.#add({
                name: `${group}:${artifact}`,
                version,
                graph: /test/i.test(match[1]) ? 'test' : 'runtime',
                declaredBy
            });
        }
    }

    // Our own native modules, and the JVM host-test harness one level deeper.
    #collectRepoModules() {
        const modulesRoot = join(this.repoRoot, 'apps/mobile/modules');
        for (const mod of readDirs(modulesRoot)) {
            const androidDir = join(modulesRoot, mod, 'android');
            const dirs = [androidDir, ...readDirs(androidDir).map(sub => join(androidDir, sub))];
            for (const dir of dirs) {
                for (const name of ['build.gradle', 'build.gradle.kts']) {
                    const file = join(dir, name);
                    if (existsSync(file)) this.#scanGradleFile(file, 'repo');
                }
            }
        }
    }

    #collectNpmPackages() {
        for (const { name, path } of pnpmPackages(this.repoRoot)) {
            const file = join(path, 'android/build.gradle');
            if (existsSync(file)) this.#scanGradleFile(file, `npm:${name}`);
        }
    }

    // react-native pins its own Maven dependencies in a Gradle version catalog,
    // which records a coordinate without a configuration. Resolving the alias
    // back to its use site supplies the missing signal — and drops the aliases
    // that are declared but never referenced, so are not in the build at all.
    #collectVersionCatalog() {
        for (const rn of reactNativeDirs(this.repoRoot)) {
            const file = join(rn, 'gradle/libs.versions.toml');
            if (!existsSync(file)) continue;
            const toml = readFileSync(file, 'utf8');
            const gradleSources = readGradleSources(rn);

            const versions = {};
            for (const match of toml.matchAll(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/gm))
                versions[match[1]] = match[2];

            for (const match of toml.matchAll(/^([a-zA-Z0-9_-]+)\s*=\s*\{\s*(.+?)\s*\}$/gm)) {
                const [, alias, spec] = match;
                const module = spec.match(/module\s*=\s*"([^"]+)"/);
                const group = spec.match(/group\s*=\s*"([^"]+)"/);
                const artifact = spec.match(/name\s*=\s*"([^"]+)"/);
                const ref = spec.match(/version\.ref\s*=\s*"([^"]+)"/);
                const literal = spec.match(/version\s*=\s*"([^"]+)"/);

                const name = module
                    ? module[1]
                    : group && artifact
                      ? `${group[1]}:${artifact[1]}`
                      : null;
                const version = ref ? versions[ref[1]] : literal ? literal[1] : null;
                if (!name || !version) continue;

                const configurations = configurationsFor(gradleSources, alias);
                if (!configurations.length) continue;

                this.#add({
                    name,
                    version,
                    graph: configurations.every(configuration => /test/i.test(configuration))
                        ? 'test'
                        : 'runtime',
                    declaredBy: `npm:react-native(catalog, ${[...new Set(configurations)].sort(compareStrings).join('/')})`
                });
            }
        }
    }
}

function readGradleSources(root, depth = 0) {
    if (depth > 5) return '';
    let text = '';
    for (const entry of existsSync(root) ? readdirSync(root, { withFileTypes: true }) : []) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const path = join(root, entry.name);
        if (entry.isDirectory()) text += readGradleSources(path, depth + 1);
        else if (/\.gradle(\.kts)?$/.test(entry.name)) text += `${readFileSync(path, 'utf8')}\n`;
    }
    return text;
}

// Which Gradle configurations reference a catalog alias. Gradle's generated
// accessors turn `-` into `.`, and the lookahead stops `libs.androidx.appcompat`
// from also matching `libs.androidx.appcompat.resources`.
function configurationsFor(gradleSources, alias) {
    const accessor = `libs.${alias.replace(/-/g, '.')}`.replace(/[.]/g, '\\.');
    const pattern = new RegExp(`([a-zA-Z]\\w*)\\s*[( ]\\s*${accessor}(?![\\w.])`, 'g');
    return [...gradleSources.matchAll(pattern)].map(match => match[1]);
}
