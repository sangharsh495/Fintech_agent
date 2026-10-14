import { parsePDFStatement } from "./pdf.parser"
import { parseExcelStatement } from "./excel.parser"
import { parseCSVStatement } from "./csv.parser"
import { PDFParseError } from "./pdf.types"

export async function parseStatementFile(fileBuffer: Buffer, fileType: "pdf" | "xlsx" | "csv", fileName: string) {
  switch (fileType) {
    case "pdf": {
      const res = await parsePDFStatement(fileBuffer)
      // Same rule as the upload route: chunks the LLM could not read mean rows
      // are missing, and a partial ledger must not be stored as if complete.
      if (res.failedChunks > 0) {
        throw new PDFParseError(
          `Part of this statement could not be read (${res.failedChunks} section${res.failedChunks > 1 ? "s" : ""}). Please try uploading it again.`
        )
      }
      return res.transactions
    }
    case "xlsx":
      return await parseExcelStatement(fileBuffer)
    case "csv":
      return await parseCSVStatement(fileBuffer)
    default:
      throw new Error(`Unsupported file type: ${fileType}`)
  }
}
