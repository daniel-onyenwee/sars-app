import {
    AttendanceNumberBasedProperties,
    AttendanceTextBasedProperties,
    type DecisionExpression,
    type SingleDecisionExpression
} from "./constants.js"
import { decisionExpressionTypeChecker } from "./type-checker.js"

interface DecisionDeterminerConstants {
    StudentName: string
    StudentRegno: string
    StudentLevel: string
    StudentGender: string
    StudentDepartment: string
    StudentFaculty: string
    StudentNumberOfClassAttended: number
    StudentPercentageOfClassAttended: number
    NumberOfClassTaught: number
}

function singleDecisionExpressionDeterminer(constants: DecisionDeterminerConstants, node: SingleDecisionExpression & DecisionExpression): "ADMIT" | "REJECT" {
    let typeCheckerResult = decisionExpressionTypeChecker([node])

    if (typeCheckerResult.status == "failed") {
        return "REJECT"
    }

    let constantValue = constants[node.property]

    if (!constantValue && constantValue != 0) {
        return "REJECT"
    }

    if (AttendanceTextBasedProperties.includes(node.property)) {
        if (node.property != "StudentRegno") {
            node.value = node.value.toString().toLowerCase()
            constantValue = constantValue.toString().toLowerCase()
        }

        if (node.operator == "eq") {
            return node.value == constantValue ? "ADMIT" : "REJECT"
        } else if (node.operator == "neq") {
            return node.value != constantValue ? "ADMIT" : "REJECT"
        }
    } else if (AttendanceNumberBasedProperties.includes(node.property)) {
        if (typeof constantValue != "number" || typeof node.value != "number") {
            return "REJECT"
        }

        if (node.operator == "eq") {
            return node.value == constantValue ? "ADMIT" : "REJECT"
        } else if (node.operator == "neq") {
            return node.value != constantValue ? "ADMIT" : "REJECT"
        } else if (node.operator == "gt") {
            return constantValue > node.value ? "ADMIT" : "REJECT"
        } else if (node.operator == "lt") {
            return constantValue < node.value ? "ADMIT" : "REJECT"
        } else if (node.operator == "gte") {
            return constantValue >= node.value ? "ADMIT" : "REJECT"
        } else if (node.operator == "lte") {
            return constantValue <= node.value ? "ADMIT" : "REJECT"
        }
    }

    return "REJECT"
}

export default function decisionDeterminer(constants: DecisionDeterminerConstants, syntaxTree: DecisionExpression[] = [], scopeType: "AND" | "OR" = "AND"): "ADMIT" | "REJECT" {
    if (syntaxTree.length > 1) {
        let returnValue: "ADMIT" | "REJECT" = singleDecisionExpressionDeterminer(constants, syntaxTree[0] as any)
        syntaxTree.shift()

        for (const node of syntaxTree) {
            let nodeReturnValue = decisionDeterminer(constants, syntaxTree, scopeType)
            if (scopeType == "AND") {
                returnValue = returnValue == "ADMIT" && nodeReturnValue == "ADMIT" ? "ADMIT" : "REJECT"
            } else if (scopeType == "OR") {
                returnValue = returnValue == "ADMIT" || nodeReturnValue == "ADMIT" ? "ADMIT" : "REJECT"
            }
        }

        return returnValue
    }

    let firstNode: any = syntaxTree[0]

    if (!firstNode) {
        return "ADMIT"
    }

    if (!firstNode.type) {
        return "REJECT"
    }

    if (firstNode.type == "SingleDecision") {
        return singleDecisionExpressionDeterminer(constants, firstNode)
    } else if (firstNode.type == "DecisionScope") {
        return decisionDeterminer(constants, firstNode.decisions || [], "OR")
    }

    return "REJECT"
}