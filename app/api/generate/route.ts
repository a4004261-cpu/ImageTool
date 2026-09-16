import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const HORDE_BASE = 'https://aihorde.net/api/v2';
const ANONYMOUS_KEY = '0000000000';
const CLIENT_AGENT = 'ImageForgeMobile:0.4:https://github.com/a4004261-cpu/ImageTool';

const ratios = {
  '1:1': { width: 512, height: 512 },
  '2:3': { width: 512, height: 768 },
  '9:16': { width: 576, height: 1024 }
} as const;

type Ratio = keyof typeof ratios;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || '').trim();
    const ratio = body?.ratio as Ratio;

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'Prompt is required.' }, { status: 400 });
    }
    if (prompt.length > 400) {
      return NextResponse.json({ ok: false, error: 'Prompt is too long.' }, { status: 400 });
    }
    if (!ratios[ratio]) {
      return NextResponse.json({ ok: false, error: 'Invalid ratio.' }, { status: 400 });
    }

    const { width, height } = ratios[ratio];
    const apiKey = process.env.AI_HORDE_API_KEY?.trim() || ANONYMOUS_KEY;

    const response = await fetch(`${HORDE_BASE}/generate/async`, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Client-Agent': CLIENT_AGENT,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        prompt,
        params: {
          cfg_scale: 7,
          sampler_name: 'k_euler_a',
          width,
          height,
          steps: 20,
          karras: true,
          n: 1
        },
        nsfw: false,
        censor_nsfw: true,
        trusted_workers: false,
        validated_backends: true,
        slow_workers: true,
        extra_slow_workers: true,
        r2: true,
        replacement_filter: true,
        shared: false,
        allow_downgrade: true,
        dry_run: false
      }),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.id) {
      const message = data?.message || data?.error || `AI Horde request failed (${response.status}).`;
      return NextResponse.json(
        { ok: false, error: String(message) },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        provider: apiKey === ANONYMOUS_KEY ? 'ai-horde-anonymous' : 'ai-horde',
        status: 'queued',
        requestId: data.id,
        kudos: data.kudos ?? null,
        width,
        height
      },
      { status: 202, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Generation request failed.'
      },
      { status: 500 }
    );
  }
}
