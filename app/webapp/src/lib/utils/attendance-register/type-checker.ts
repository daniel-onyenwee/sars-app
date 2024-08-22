import {
    AttendanceNumberBasedOperator,
    AttendanceProperties,
    AttendanceTextBasedProperties,
    AttendanceTextBasedOperator,
    type DecisionExpression,
    type SingleDecisionExpression,
} from "./constants.js"

type TypeCheckerResult = {
    status: "failed",
    error: {
        message: string,
        code: number
    }
} | {
    status: "success",
    error: null
}

const singleDecisionExpressionTypeChecker = (node: SingleDecisionExpression & DecisionExpression): TypeCheckerResult => {
    if (!node.property) {
        return ({
            status: "failed",
            error: {
                message: "Missing attendance decision parameter 'property'",
                code: 4008
            }
        })
    }

    if (!AttendanceProperties.includes(node.property)) {
        return ({
            status: "failed",
            error: {
                message: `Unknown attendance property '${node.property}'`,
                code: 4009
            }
        })
    }

    let isTextBasedAttendanceProperty = AttendanceTextBasedProperties.includes(node.property) ? true : false

    if (!node.operator) {
        return ({
            status: "failed",
            error: {
                message: "Missing attendance decision parameter 'operator'",
                code: 4010
            }
        })
    }

    if (isTextBasedAttendanceProperty) {
        if (!AttendanceTextBasedOperator.includes(node.operator)) {
            return ({
                status: "failed",
                error: {
                    message: `Unsupported decision operator '${node.operator}'`,
                    code: 4011
                }
            })
        }
    } else {
        if (!AttendanceNumberBasedOperator.includes(node.operator)) {
            return ({
                status: "failed",
                error: {
                    message: `Unsupported decision operator '${node.operator}'`,
                    code: 4011
                }
            })
        }
    }

    if (!node.value && node.value != 0) {
        return ({
            status: "failed",
            error: {
                message: "Missing attendance decision parameter 'value'",
                code: 4012
            }
        })
    }

    if (isTextBasedAttendanceProperty) {
        if (node.property == "StudentGender" && !["MALE", "FEMALE"].includes(node.value)) {
            return ({
                status: "failed",
                error: {
                    message: `Unsupported '${node.property}' value '${node.value}'`,
                    code: 4013
                }
            })
        } else if (node.property == "StudentLevel" && !/L_(100|200|300|400|500|600|700|800|900|10000)/.test(node.value)) {
            return ({
                status: "failed",
                error: {
                    message: `Unsupported '${node.property}' value '${node.value}'`,
                    code: 4013
                }
            })
        }
    } else {
        if (isNaN(parseFloat(node.value as any))) {
            return ({
                status: "failed",
                error: {
                    message: `Unsupported '${node.property}' value '${node.value}'`,
                    code: 4013
                }
            })
        }
    }

    return ({
        status: "success",
        error: null
    })
}

export const decisionExpressionTypeChecker = (syntaxTree: DecisionExpression[]): TypeCheckerResult => {
    if (syntaxTree.length > 1) {
        for (const node of syntaxTree) {
            let typeCheckerResult = decisionExpressionTypeChecker([node])
            if (typeCheckerResult.status == "failed") {
                return typeCheckerResult
            }
        }
    }

    let firstNode: any = syntaxTree[0]

    if (!firstNode) {
        return { status: "success", error: null }
    }

    if (!firstNode.type) {
        return {
            status: "failed",
            error: {
                message: "Missing attendance decision parameter 'type'",
                code: 4007
            }
        }
    }

    if (firstNode.type == "SingleDecision") {
        return singleDecisionExpressionTypeChecker(firstNode)
    } else {
        return decisionExpressionTypeChecker(firstNode.decisions)
    }
}