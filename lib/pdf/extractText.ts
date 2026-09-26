import { PasswordRequiredError } from "@/server/services/parser/pdf.types";

// Setup lightweight polyfills required by pdfjs-dist before loading pdf-parse
// (Avoids jsdom which pulls ESM @exodus/bytes and triggers ERR_REQUIRE_ESM on Vercel)
if (typeof global !== "undefined") {
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true;
      isIdentity = true;
      constructor(_init?: any) {}
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      transformPoint(p?: any) { return p || { x: 0, y: 0 }; }
      inverse() { return this; }
    };
  }
  if (!(global as any).Path2D) {
    (global as any).Path2D = class Path2D {
      addPath() {}
      closePath() {}
      moveTo() {}
      lineTo() {}
      bezierCurveTo() {}
      quadraticCurveTo() {}
      arc() {}
      arcTo() {}
      ellipse() {}
      rect() {}
    };
  }
}

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