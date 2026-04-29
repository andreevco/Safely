const { withAppDelegate } = require('@expo/config-plugins');

const MARKER = '// @MMKVNoBackup';

const SNIPPET = `

    ${MARKER}
    if let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
      let mmkvDir = docs.appendingPathComponent("mmkv", isDirectory: true)
      try? FileManager.default.createDirectory(at: mmkvDir, withIntermediateDirectories: true)
      var url = mmkvDir
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try? url.setResourceValues(values)
    }
`;

module.exports = function withMMKVNoBackup(config) {
    return withAppDelegate(config, cfg => {
        if (cfg.modResults.language !== 'swift') {
            throw new Error(
                'withMMKVNoBackup: only Swift AppDelegate is supported'
            );
        }

        if (cfg.modResults.contents.includes(MARKER)) {
            return cfg;
        }

        const anchorRe =
            /(didFinishLaunchingWithOptions[^{]*\)\s*->\s*Bool\s*\{)/;
        if (!anchorRe.test(cfg.modResults.contents)) {
            throw new Error(
                'withMMKVNoBackup: didFinishLaunchingWithOptions signature not found in AppDelegate.swift'
            );
        }

        cfg.modResults.contents = cfg.modResults.contents.replace(
            anchorRe,
            `$1${SNIPPET}`
        );

        return cfg;
    });
};
