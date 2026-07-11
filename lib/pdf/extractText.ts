import { JSDOM } from "jsdom";

// Setup polyfills before loading pdf-parse
const dom = new JSDOM();
global.DOMMatrix = dom.window.DOMMatrix;
global.Path2D = dom.window.Path2D;

import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const data = await pdfParse(buffer);
  return { text: data.text, numPages: data.numpages };
}