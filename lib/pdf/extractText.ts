import { PDFParse, VerbosityLevel } from "pdf-parse";

/**
 * Extracts text and page count from a PDF buffer using the Node-safe
 * `pdf-parse` v2 library (which uses @napi-rs/canvas + pdfjs-dist under the hood).
 *
 * Note: pdf-parse v2 exports a `PDFParse` class. `getText()` returns a
 * `TextResult` whose `.text` is the full concatenated document string and
 * `.total` is the number of pages. `getInfo()` returns `InfoResult` with
 * `.total` (page count) — we use it as the authoritative page count.
 */
export async function extractPdfText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  // verbosity: errors only — avoids noisy info/warn logs from pdfjs internals
  const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: VerbosityLevel.ERRORS });

  try {
    const textResult = await parser.getText();
    // Prefer the page count reported by getInfo(); fall back to the text result total.
    let numPages = textResult.total;
    try {
      const info = await parser.getInfo();
      if (info?.total && info.total > 0) {
        numPages = info.total;
      }
    } catch {
      // getInfo() is best-effort for page count; text total is already set.
    }

    return { text: textResult.text ?? "", numPages };
  } finally {
    await parser.destroy();
  }
}