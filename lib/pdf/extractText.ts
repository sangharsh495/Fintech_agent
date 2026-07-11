import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
  await parser.load();
  const text = await parser.getText();
  const info = await parser.getInfo();
  await parser.destroy();
  return { text, numPages: info.total };
}
