module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            [
                'babel-preset-expo',
                {
                    jsxRuntime: 'automatic',
                    jsxImportSource: 'react'
                }
            ]
        ],
        plugins: [
            [
                'react-native-unistyles/plugin',
                {
                    root: 'src'
                }
            ],
            [
                '@babel/plugin-transform-flow-strip-types',
                {
                    allowDeclareFields: true
                }
            ],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-transform-explicit-resource-management'
        ]
    };
};
