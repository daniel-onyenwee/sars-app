import * as XLSX from "xlsx"

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

export function createExcelFile(property: ExcelProperty, data: Record<string, any>[]): Buffer {
    const workbook = XLSX.utils.book_new()

    const columnsMap = new Map(property.columns.map(({ key, width, ...otherData }) => [key, { width: width || 10, ...otherData }]))

    data = data.map((row) => {
        const newRow: Record<string, any> = {};

        for (const key of columnsMap.keys()) {
            const columnData = columnsMap.get(key);

            if (columnData && row[key] != undefined) {
                newRow[columnData.header] = row[key];
            }
        }

        return newRow;
    });

    const sheet = XLSX.utils.json_to_sheet(data)

    sheet["!cols"] = Array.from(columnsMap.values()).map(({ width }) => ({ width }))

    XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1")

    const workbookBuffer = XLSX.write(workbook, { type: "buffer", Props: { CreatedDate: property.created, Author: property.creator, Title: property.title } })

    return Buffer.from(workbookBuffer)
}