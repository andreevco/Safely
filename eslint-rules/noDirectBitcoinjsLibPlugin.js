// Local ESLint plugin that forbids direct imports of 'bitcoinjs-lib'.
//
// bitcoinjs-lib v7 requires initEccLib(ecc) to be called before any Taproot
// (P2TR / bech32m) operation — otherwise `bitcoin.address.toOutputScript('bc1p…')`
// and other Schnorr/Taproot paths throw "No ECC Library provided".
//
// All consumers must import through the wrapper at
// packages/core/src/blockchain-api/btc/bitcoinjs.ts, which performs the init
// once at module load. Only that wrapper may import 'bitcoinjs-lib' directly.

const WRAPPER_PATH_SUFFIX = 'packages/core/src/blockchain-api/btc/bitcoinjs.ts';
const RESTRICTED_SPECIFIER = 'bitcoinjs-lib';

function isWrapperFile(filename) {
    if (!filename) return false;
    return filename.replace(/\\/g, '/').endsWith(WRAPPER_PATH_SUFFIX);
}

const ruleNoDirectBitcoinjsLib = {
    meta: {
        type: 'problem',
        docs: {
            description:
                "Disallow importing 'bitcoinjs-lib' directly; go through the wrapper that calls initEccLib().",
            recommended: false
        },
        schema: [],
        messages: {
            noDirect:
                "Do not import '{{specifier}}' directly. Import from the wrapper at packages/core/src/blockchain-api/btc/bitcoinjs.ts, which calls initEccLib() so Taproot (bc1p…) operations work."
        }
    },
    create(context) {
        const filename =
            (context.filename ?? (typeof context.getFilename === 'function' ? context.getFilename() : '')) || '';
        if (isWrapperFile(filename)) return {};

        function checkSourceNode(node) {
            if (!node || node.type !== 'Literal') return;
            if (node.value !== RESTRICTED_SPECIFIER) return;
            context.report({
                node,
                messageId: 'noDirect',
                data: { specifier: RESTRICTED_SPECIFIER }
            });
        }

        return {
            ImportDeclaration(node) {
                checkSourceNode(node.source);
            },
            ImportExpression(node) {
                checkSourceNode(node.source);
            },
            ExportAllDeclaration(node) {
                checkSourceNode(node.source);
            },
            ExportNamedDeclaration(node) {
                checkSourceNode(node.source);
            }
        };
    }
};

export default {
    rules: {
        'no-direct-bitcoinjs-lib': ruleNoDirectBitcoinjsLib
    }
};
