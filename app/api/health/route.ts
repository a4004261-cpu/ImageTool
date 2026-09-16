import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, app: 'IMAGE FORGE MOBILE', version: '0.2.0', provider: 'mock' }, { headers: { 'Cache-Control': 'no-store' } });
}
