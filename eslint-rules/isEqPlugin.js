// Local ESLint plugin providing a rule that forbids strict equality checks
// for objects that implement an `isEq` method.
//
// The rule relies on TypeScript parser services to detect whether either operand
// type has a property named `isEq`. If so, it suggests using that method instead
// of `===`/`!==`.
import * as ts from 'typescript';

function isNullOrUndefined(node) {
    if (!node) return false;
    if (node.type === 'Literal' && node.value === null) return true;
    if (node.type === 'Identifier' && node.name === 'undefined') return true;
    return false;
}

/** Returns the object on which .toString() is called, or null if not a toString() call. */
function getBaseOfToStringCall(node) {
    if (!node || node.type !== 'CallExpression') return null;
    const callee = node.callee;
    if (callee.type !== 'MemberExpression') return null;
    const prop = callee.property;
    const name = prop.type === 'Identifier' ? prop.name : prop.type === 'Literal' ? prop.value : null;
    if (name === 'toString') return callee.object;
    return null;
}

function hasIsEqProperty(type, checker) {
    if (!type || !checker) return false;
    const equalityMethodNames = ['isEq', 'isEqual', 'eq', 'equals'];

    function checkDirect(t) {
        try {
            if (typeof checker.getPropertyOfType === 'function') {
                const apparent = checker.getApparentType(t);
                for (const name of equalityMethodNames) {
                    if (checker.getPropertyOfType(apparent, name)) return true;
                    if (checker.getPropertyOfType(t, name)) return true;
                }
            }
            if (typeof t.getProperty === 'function') {
                for (const name of equalityMethodNames) {
                    if (t.getProperty(name)) return true;
                }
            }
        } catch {
            return false;
        }
        return false;
    }

    try {
        // Unwrap type parameter constraints
        if (type.flags & ts.TypeFlags.TypeParameter) {
            const constrained = checker.getBaseConstraintOfType
                ? checker.getBaseConstraintOfType(type)
                : null;
            if (constrained && hasIsEqProperty(constrained, checker)) return true;
        }

        // Unwrap literal/base types
        if (checker.getBaseTypeOfLiteralType) {
            const base = checker.getBaseTypeOfLiteralType(type);
            if (base && base !== type) {
                if (hasIsEqProperty(base, checker)) return true;
            }
        }

        // Handle unions/intersections — if ANY constituent has the method, flag it
        const isUnionOrIntersection =
            (type.flags & ts.TypeFlags.UnionOrIntersection) === ts.TypeFlags.UnionOrIntersection;
        if (isUnionOrIntersection && Array.isArray(type.types)) {
            for (const sub of type.types) {
                if (hasIsEqProperty(sub, checker)) return true;
            }
            return false;
        }

        // Direct check
        if (checkDirect(type)) return true;
    } catch {
        // Be conservative on API differences
        return false;
    }
    return false;
}

const ruleNoStrictEqWhenIsEq = {
    meta: {
        type: 'problem',
        docs: {
            description: "Disallow '===' and '!==' when either operand type provides an 'isEq' method",
            recommended: false
        },
        schema: [],
        messages: {
            preferIsEq:
                "Type appears to implement an equality method (isEq, isEqual, eq, equals). Use that instead of '{{operator}}'.",
            preferIsEqOverToString:
                "Both operands have an equality method (isEq, isEqual, eq, equals). Use that instead of comparing via toString()."
        }
    },
    create(context) {
        // In ESLint v9 with typescript-eslint v8, parser services live under sourceCode
        const services = (context.sourceCode && context.sourceCode.parserServices) || context.parserServices;
        const program = services && services.program;
        const esTreeNodeToTSNodeMap = services && services.esTreeNodeToTSNodeMap;
        const checker = program && typeof program.getTypeChecker === 'function' ? program.getTypeChecker() : null;

        return {
            BinaryExpression(node) {
                // If type info is unavailable, we cannot safely determine presence of isEq-like methods.
                // Still register the visitor to avoid silently disabling the rule.
                if (!program || !esTreeNodeToTSNodeMap || !checker) return;
                if (node.operator !== '===' && node.operator !== '!==') return;

                // Check for a.toString() === b.toString() when both a and b have an isEq-like method
                const leftBase = getBaseOfToStringCall(node.left);
                const rightBase = getBaseOfToStringCall(node.right);
                if (leftBase && rightBase) {
                    const tsLeftBase = esTreeNodeToTSNodeMap.get(leftBase);
                    const tsRightBase = esTreeNodeToTSNodeMap.get(rightBase);
                    if (tsLeftBase && tsRightBase) {
                        const leftBaseType = checker.getTypeAtLocation(tsLeftBase);
                        const rightBaseType = checker.getTypeAtLocation(tsRightBase);
                        const leftHas = hasIsEqProperty(leftBaseType, checker);
                        const rightHas = hasIsEqProperty(rightBaseType, checker);
                        if (leftHas && rightHas) {
                            context.report({
                                node,
                                messageId: 'preferIsEqOverToString'
                            });
                            return;
                        }
                    }
                }

                // Allow null/undefined comparisons
                if (isNullOrUndefined(node.left) || isNullOrUndefined(node.right)) return;

                const tsLeft = esTreeNodeToTSNodeMap.get(node.left);
                const tsRight = esTreeNodeToTSNodeMap.get(node.right);

                if (!tsLeft || !tsRight) return;

                const leftType = checker.getTypeAtLocation(tsLeft);
                const rightType = checker.getTypeAtLocation(tsRight);

                const leftHas = hasIsEqProperty(leftType, checker);
                const rightHas = hasIsEqProperty(rightType, checker);

                if (leftHas || rightHas) {
                    context.report({
                        node,
                        messageId: 'preferIsEq',
                        data: { operator: node.operator }
                    });
                }
            }
        };
    }
};

export default {
    rules: {
        'no-strict-eq-when-isEq': ruleNoStrictEqWhenIsEq
    }
};