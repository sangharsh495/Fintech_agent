import { PasswordRequiredError } from "@/server/services/parser/pdf.types";

// Setup lightweight polyfills before loading pdf-parse (eliminates jsdom & @exodus/bytes ERR_REQUIRE_ESM)
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: number[] | string | DOMMatrixPolyfill) {
      if (Array.isArray(init)) {
        if (init.length === 6) {
          this.a = this.m11 = init[0] ?? 1;
          this.b = this.m12 = init[1] ?? 0;
          this.c = this.m21 = init[2] ?? 0;
          this.d = this.m22 = init[3] ?? 1;
          this.e = this.m41 = init[4] ?? 0;
          this.f = this.m42 = init[5] ?? 0;
          this.is2D = true;
        } else if (init.length === 16) {
          this.m11 = this.a = init[0] ?? 1;
          this.m12 = this.b = init[1] ?? 0;
          this.m13 = init[2] ?? 0;
          this.m14 = init[3] ?? 0;
          this.m21 = this.c = init[4] ?? 0;
          this.m22 = this.d = init[5] ?? 1;
          this.m23 = init[6] ?? 0;
          this.m24 = init[7] ?? 0;
          this.m31 = init[8] ?? 0;
          this.m32 = init[9] ?? 0;
          this.m33 = init[10] ?? 1;
          this.m34 = init[11] ?? 0;
          this.m41 = this.e = init[12] ?? 0;
          this.m42 = this.f = init[13] ?? 0;
          this.m43 = init[14] ?? 0;
          this.m44 = init[15] ?? 1;
          this.is2D = false;
        }
        this.isIdentity = this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
      }
    }

    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    inverse() { return this; }
    transformPoint(point?: any) { return point || { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array() { return new Float32Array([this.m11, this.m12, this.m13, this.m14, this.m21, this.m22, this.m23, this.m24, this.m31, this.m32, this.m33, this.m34, this.m41, this.m42, this.m43, this.m44]); }
    toFloat64Array() { return new Float64Array([this.m11, this.m12, this.m13, this.m14, this.m21, this.m22, this.m23, this.m24, this.m31, this.m32, this.m33, this.m34, this.m41, this.m42, this.m43, this.m44]); }
  }

  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
  (global as any).DOMMatrix = DOMMatrixPolyfill;
}

if (typeof (globalThis as any).Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {};
  (global as any).Path2D = (globalThis as any).Path2D;
}

if (typeof (globalThis as any).ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {};
  (global as any).ImageData = (globalThis as any).ImageData;
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