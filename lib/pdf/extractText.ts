import { JSDOM } from "jsdom";
import { PasswordRequiredError } from "@/server/services/parser/pdf.types";

// Setup polyfills before loading pdf-parse
const dom = new JSDOM();
(global as any).DOMMatrix = dom.window.DOMMatrix;
(global as any).Path2D = dom.window.Path2D;

// @ts-expect-error No types for internal import
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(
  buffer: Buffer,
  password?: string
): Promise<{ text: string; numPages: number }> {
  try {
    const options = password ? { password } : undefined;
    const data = await pdfParse(buffer, options);
    return { text: data.text || "", numPages: data.numpages || 1 };
  } catch (err: any) {
    const errMsg = (err?.message || "").toLowerCase();
    const errName = err?.name || "";

    if (
      errName === "PasswordException" ||
      errMsg.includes("password") ||
      errMsg.includes("encrypted") ||
      errMsg.includes("bad decrypt")
    ) {
      throw new PasswordRequiredError(
        password
          ? "Incorrect PDF password. Please verify and re-enter."
          : "This PDF is password-protected. Please enter your password to unlock."
      );
    }

    throw err;
  }
}