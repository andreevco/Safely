import { GRADLE_CONFIGURATION, parseGradleTree } from './gradle-tree-parser.mjs';
import { parseSdkDependencies } from './sdk-dependencies-parser.mjs';

// Two capture paths, told apart by content rather than by a flag: the file the
// Android Gradle Plugin writes on its own, and the Gradle dependency tree that
// would have to replace it if AGP ever stopped. The `source` travels with the
// coordinates, because which of the two produced them decides what they carry —
// only AGP's file has digests.
export function parseAndroidGraph(text) {
    if (/^library \{/m.test(text))
        return {
            source: 'agp :app:sdkReleaseDependencyData',
            coordinates: parseSdkDependencies(text)
        };
    return {
        source: `gradle :app:dependencies --configuration ${GRADLE_CONFIGURATION}`,
        coordinates: parseGradleTree(text)
    };
}
