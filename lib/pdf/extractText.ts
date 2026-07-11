import pdfParse from "pdf-parse/lib/pdf-parse.js"

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const data = await pdfParse(buffer)
  return { text: data.text, numPages: data.numpages }
}