interface DecisionExpression {
    type: "SingleDecision" | "DecisionScope",
}

interface DecisionScopeExpression {
    decisions: DecisionExpression[]
}

type NumberBasedDecisionOperator = "gt" |
    "lt" |
    "gte" |
    "lte"

type NumberBasedDecisionProperty = "StudentNumberOfClassAttended" |
    "StudentPercentageOfClassAttended" |
    "NumberOfClassTaught"

type TextBasedDecisionOperator = "eq" | "neq"

type TextBasedDecisionProperty = "StudentName" |
    "StudentRegno" |
    "StudentLevel" |
    "StudentGender" |
    "StudentDepartment" |
    "StudentFaculty"

interface SingleTextBasedDecisionExpression {
    property: TextBasedDecisionProperty
    operator: TextBasedDecisionOperator
    value: string
}

interface SingleNumberBasedDecisionExpression {
    property: NumberBasedDecisionProperty
    operator: NumberBasedDecisionOperator
    value: number
}

type SingleDecisionExpression = SingleTextBasedDecisionExpression | SingleNumberBasedDecisionExpression

const AttendanceTextBasedProperties = [
    "StudentName",
    "StudentRegno",
    "StudentLevel",
    "StudentGender",
    "StudentDepartment",
    "StudentFaculty"
]

const AttendanceNumberBasedProperties = [
    "StudentNumberOfClassAttended",
    "StudentPercentageOfClassAttended",
    "NumberOfClassTaught"
]

const AttendanceProperties = [
    ...AttendanceNumberBasedProperties,
    ...AttendanceTextBasedProperties
]

const AttendanceTextBasedOperator = [
    "eq",
    "neq"
]

const AttendanceNumberBasedOperator = [
    "gt",
    "lt",
    "gte",
    "lte",
    ...AttendanceTextBasedOperator
]

export {
    AttendanceNumberBasedOperator,
    AttendanceTextBasedOperator,
    AttendanceNumberBasedProperties,
    AttendanceTextBasedProperties,
    AttendanceProperties,
}

export type {
    SingleDecisionExpression,
    DecisionExpression
}