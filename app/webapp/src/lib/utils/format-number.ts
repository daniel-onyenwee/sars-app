import numbro from "numbro"

export function formatNumber(value: number): string {
    return numbro(value).format({
        average: true,
        output: "number",
        mantissa: 2,
        optionalMantissa: true,
    })
}