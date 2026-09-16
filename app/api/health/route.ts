import { NextResponse } from 'next/server';

export async function GET() {
  const provider = process.env.HF_TOKEN ? 'huggingface' : 'mock';
  return NextResponse.json(
    { ok: true, app: 'IMAGE FORGE MOBILE', version: '0.3.0', provider },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
