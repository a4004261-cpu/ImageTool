import { NextResponse } from 'next/server';

export async function GET() {
  const provider = process.env.AI_HORDE_API_KEY ? 'ai-horde' : 'ai-horde-anonymous';
  return NextResponse.json(
    { ok: true, app: 'IMAGE FORGE MOBILE', version: '0.4.0', provider },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
