// Local ESLint plugin that forbids importing `useMutation` from
// '@tanstack/react-query' anywhere except the project's wrapper.
//
// Project provides a wrapped `useMutation` from '@safely/ux' that:
// - Captures the active-account Logger at mutate() time via variables payload.
// - Wraps mutationFn in try/catch and logs errors race-safely.
//
// Direct usage of TanStack's useMutation bypasses these guarantees.
//
// The rule catches:
// - `import { useMutation } from '@tanstack/react-query'`
// - `import { useMutation as foo } from '@tanstack/react-query'` (alias)
// - `import * as RQ from '@tanstack/react-query'; RQ.useMutation(...)` (namespace)
// - `export { useMutation } from '@tanstack/react-query'` (re-export)

const RESTRICTED_SPECIFIER = '@tanstack/react-query';
const RESTRICTED_IMPORT = 'useMutation';

const ruleNoTanstackUseMutation = {
    meta: {
        type: 'problem',
        docs: {
            description:
                "Disallow importing 'useMutation' from '@tanstack/react-query'; use the wrapped version from '@safely/ux' to ensure race-safe logger.",
            recommended: false
        },
        schema: [],
        messages: {
            noDirect:
                "Do not import '{{name}}' from '@tanstack/react-query'. Use 'useMutation' from '@safely/ux' instead — it captures the active-account logger at mutate() time and wraps mutationFn with race-safe error logging."
        }
    },
    create(context) {
        const filename = context.filename ?? '';
        // Allowlist: the wrapper itself + tests.
        if (filename.replace(/\\/g, '/').endsWith('packages/ux/src/shared/query-core/hooks/useMutation.ts')) {
            return {};
        }

        const namespaceLocals = new Set();

        function reportSpecifier(node, name) {
            context.report({
                node,
                messageId: 'noDirect',
                data: { name }
            });
        }

        return {
            ImportDeclaration(node) {
                if (!node.source || node.source.value !== RESTRICTED_SPECIFIER) return;
                for (const specifier of node.specifiers) {
                    if (specifier.type === 'ImportSpecifier') {
                        const importedName =
                            specifier.imported.type === 'Identifier'
                                ? specifier.imported.name
                                : null;
                        if (importedName === RESTRICTED_IMPORT) {
                            reportSpecifier(specifier, importedName);
                        }
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                        namespaceLocals.add(specifier.local.name);
                    }
                }
            },
            ExportNamedDeclaration(node) {
                if (!node.source || node.source.value !== RESTRICTED_SPECIFIER) return;
                for (const specifier of node.specifiers ?? []) {
                    if (specifier.type !== 'ExportSpecifier') continue;
                    const localName =
                        specifier.local && specifier.local.type === 'Identifier'
                            ? specifier.local.name
                            : null;
                    const exportedName =
                        specifier.exported && specifier.exported.type === 'Identifier'
                            ? specifier.exported.name
                            : null;
                    if (localName === RESTRICTED_IMPORT || exportedName === RESTRICTED_IMPORT) {
                        reportSpecifier(specifier, RESTRICTED_IMPORT);
                    }
                }
            },
            ExportAllDeclaration(node) {
                if (!node.source || node.source.value !== RESTRICTED_SPECIFIER) return;
                // Re-exporting everything from tanstack would propagate useMutation. Forbid.
                context.report({
                    node,
                    messageId: 'noDirect',
                    data: { name: RESTRICTED_IMPORT }
                });
            },
            MemberExpression(node) {
                if (
                    node.object.type !== 'Identifier' ||
                    !namespaceLocals.has(node.object.name)
                ) {
                    return;
                }
                const propName =
                    node.property.type === 'Identifier'
                        ? node.property.name
                        : node.property.type === 'Literal'
                          ? node.property.value
                          : null;
                if (propName === RESTRICTED_IMPORT) {
                    reportSpecifier(node, RESTRICTED_IMPORT);
                }
            }
        };
    }
};

export default {
    rules: {
        'no-tanstack-use-mutation': ruleNoTanstackUseMutation
    }
};
