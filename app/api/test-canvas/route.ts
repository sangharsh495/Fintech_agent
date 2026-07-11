import { NextResponse } from 'next/server';
import * as canvas from '@napi-rs/canvas';

export async function GET() {
  return NextResponse.json({
    hasDOMMatrix: typeof canvas.DOMMatrix !== 'undefined',
    keys: Object.keys(canvas)
  });
}
