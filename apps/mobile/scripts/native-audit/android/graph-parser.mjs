import { looksBinary, parseAppDependencies } from './dependencies-pb-parser.mjs';
import { GRADLE_CONFIGURATION, parseGradleTree } from './gradle-tree-parser.mjs';
import { parseSdkDependencies } from './sdk-dependencies-parser.mjs';

// Three capture paths. `label` names the artifact a graph describes, so a run
// that gates two of them can say which one a finding is in; `source` says how it
// was produced. Only AGP's two forms carry digests.
export function parseAndroidGraph(text) {
    if (/^library \{/m.test(text))
        return {
            label: 'apk',
            source: 'agp :app:sdkReleaseDependencyData',
            coordinates: parseSdkDependencies(text)
        };
    return {
        label: 'gradle',
        source: `gradle :app:dependencies --configuration ${GRADLE_CONFIGURATION}`,
        coordinates: parseGradleTree(text)
    };
}

// The only graph that describes what ships to Play: `:app:bundleRelease` writes
// no `sdkDependencies.txt`.
export function parseAndroidBundleGraph(bytes) {
    if (!looksBinary(bytes))
        throw new Error('this is the text form of the graph — pass it as --android, not --aab');
    return {
        label: 'aab',
        source: 'agp :app:bundleRelease dependencies.pb',
        coordinates: parseAppDependencies(bytes)
    };
}
