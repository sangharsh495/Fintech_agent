import { parsePDFStatement } from "./pdf.parser"
import { parseExcelStatement } from "./excel.parser"
import { parseCSVStatement } from "./csv.parser"

export async function parseStatementFile(fileBuffer: Buffer, fileType: "pdf" | "xlsx" | "csv", fileName: string) {
  switch (fileType) {
    case "pdf":
      // Depending on parsePDFStatement signature, we may need to just return its transactions
      const res = await parsePDFStatement(fileBuffer)
      // @ts-ignore
      return res.transactions || res
    case "xlsx":
      return await parseExcelStatement(fileBuffer)
    case "csv":
      return await parseCSVStatement(fileBuffer)
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
