import ExcelJS from "exceljs"

interface ExcelProperty {
    creator: string
    title: string
    created: Date
    firstHeader: string
    columns: {
        header: string
        key: string
        width?: number
    }[]
}

export async function createExcelFile(property: ExcelProperty, data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = property.creator
    workbook.title = property.title
    workbook.created = property.created

    const workSheet = workbook.addWorksheet("Sheet 1", {
        headerFooter: {
            firstHeader: property.firstHeader
        }
    })

    workSheet.columns = property.columns

    workSheet.addRows(data)

    return Buffer.from(await workbook.xlsx.writeBuffer())
}