/**
 * Canvas Polyfill for pdfjs-dist in Node.js/serverless environments
 * 
 * This module MUST be imported BEFORE pdfjs-dist to provide the required
 * DOM canvas APIs (DOMMatrix, Path2D, Canvas, etc.) that pdf.js depends on.
 * 
 * @napi-rs/canvas is a native Node.js implementation of the Canvas API
 * that works in serverless environments like Vercel/Next.js.
 */

// Import @napi-rs/canvas first to polyfill global DOM APIs
// @ts-ignore - Float16Array type issue in @napi-rs/canvas types (upstream)
import { DOMMatrix, Path2D, Canvas, CanvasRenderingContext2D, ImageData, ImageBitmap, DOMMatrixReadOnly } from '@napi-rs/canvas';

// Polyfill global DOM APIs that pdf.js expects
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = DOMMatrix as any;
}
if (typeof globalThis.DOMMatrixReadOnly === 'undefined') {
  globalThis.DOMMatrixReadOnly = DOMMatrixReadOnly as any;
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = Path2D as any;
}
if (typeof globalThis.Canvas === 'undefined') {
  globalThis.Canvas = Canvas as any;
}
if (typeof globalThis.CanvasRenderingContext2D === 'undefined') {
  globalThis.CanvasRenderingContext2D = CanvasRenderingContext2D as any;
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = ImageData as any;
}
if (typeof globalThis.ImageBitmap === 'undefined') {
  globalThis.ImageBitmap = ImageBitmap as any;
}

// Also polyfill Document.createElement for canvas if needed
if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tagName: string) => {
      if (tagName.toLowerCase() === 'canvas') {
        // Canvas constructor requires width and height
        return new Canvas(1, 1);
      }
      // Return a minimal element for other tags
      return {
        tagName: tagName.toUpperCase(),
        getContext: () => null,
      };
    },
    createElementNS: () => null,
    body: {},
    head: {},
  };
}

// Export a marker to confirm polyfill loaded
export const canvasPolyfillLoaded = true;
