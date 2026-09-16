import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HORDE_BASE = 'https://aihorde.net/api/v2';
const CLIENT_AGENT = 'ImageForgeMobile:0.4:https://github.com/a4004261-cpu/ImageTool';

function validId(id: string) {
  return /^[0-9a-f-]{20,64}$/i.test(id);
}

export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get('id') || '').trim();
  if (!id || !validId(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid request id.' }, { status: 400 });
  }

  try {
    const headers = {
      'Client-Agent': CLIENT_AGENT,
      Accept: 'application/json'
    };

    const checkResponse = await fetch(`${HORDE_BASE}/generate/check/${encodeURIComponent(id)}`, {
      headers,
      cache: 'no-store'
    });
    const check = await checkResponse.json().catch(() => ({}));

    if (!checkResponse.ok) {
      const message = check?.message || check?.error || `AI Horde status failed (${checkResponse.status}).`;
      return NextResponse.json({ ok: false, error: String(message) }, { status: checkResponse.status });
    }

    if (check?.faulted) {
      return NextResponse.json(
        { ok: false, error: 'The free generation request faulted. Please try again.' },
        { status: 502 }
      );
    }

    const finished = Number(check?.finished || 0);
    const done = Boolean(check?.done);

    if (!done && finished < 1) {
      return NextResponse.json(
        {
          ok: true,
          provider: 'ai-horde',
          status: 'waiting',
          queuePosition: check?.queue_position ?? null,
          waitTime: check?.wait_time ?? null,
          processing: Number(check?.processing || 0),
          waiting: Number(check?.waiting || 0)
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const statusResponse = await fetch(`${HORDE_BASE}/generate/status/${encodeURIComponent(id)}`, {
      headers,
      cache: 'no-store'
    });
    const status = await statusResponse.json().catch(() => ({}));

    if (!statusResponse.ok) {
      const message = status?.message || status?.error || `AI Horde result failed (${statusResponse.status}).`;
      return NextResponse.json({ ok: false, error: String(message) }, { status: statusResponse.status });
    }

    const generation = Array.isArray(status?.generations) ? status.generations[0] : null;
    if (!generation?.img) {
      if (!done) {
        return NextResponse.json(
          { ok: true, provider: 'ai-horde', status: 'waiting' },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }
      return NextResponse.json(
        { ok: false, error: 'Generation completed without an image.' },
        { status: 502 }
      );
    }

    const raw = String(generation.img);
    const imageUrl = /^https?:\/\//i.test(raw) ? raw : `data:image/webp;base64,${raw}`;

    return NextResponse.json(
      {
        ok: true,
        provider: 'ai-horde',
        status: 'complete',
        imageUrl,
        model: generation.model || null,
        seed: generation.seed ?? null
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Status check failed.' },
      { status: 500 }
    );
  }
}
