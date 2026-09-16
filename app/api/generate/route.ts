import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ratios = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 768, height: 1152 },
  '9:16': { width: 576, height: 1024 }
} as const;

type Ratio = keyof typeof ratios;

const DEFAULT_HF_MODEL_URL =
  'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';

function esc(v: string) {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mockImage(prompt: string, width: number, height: number) {
  const safe = esc(prompt.slice(0, 120));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="50%" stop-color="#1d4ed8"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="20%" text-anchor="middle" fill="white" font-size="42" font-family="Arial" font-weight="700">IMAGE FORGE MOCK</text><text x="50%" y="42%" text-anchor="middle" fill="#dbeafe" font-size="28" font-family="Arial">Real GPU provider is not connected yet.</text><foreignObject x="10%" y="52%" width="80%" height="25%"><div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font:26px Arial;text-align:center;word-wrap:break-word">${safe}</div></foreignObject><text x="50%" y="88%" text-anchor="middle" fill="#cbd5e1" font-size="22" font-family="Arial">Free mock mode</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

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
    const hfToken = process.env.HF_TOKEN?.trim();

    // No secret configured: keep the app fully usable in free mock mode.
    if (!hfToken) {
      return NextResponse.json(
        {
          ok: true,
          provider: 'mock',
          imageDataUrl: mockImage(prompt, width, height),
          width,
          height
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const endpoint = process.env.HF_MODEL_URL?.trim() || DEFAULT_HF_MODEL_URL;
    const timeoutMs = Math.min(
      Math.max(Number(process.env.REQUEST_TIMEOUT_MS || 55000), 5000),
      58000
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
          Accept: 'image/*'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height }
        }),
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        return NextResponse.json(
          {
            ok: false,
            error: `Image provider error (${response.status}).`,
            detail
          },
          { status: 502 }
        );
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) {
        return NextResponse.json(
          { ok: false, error: 'Image provider returned an empty response.' },
          { status: 502 }
        );
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const imageDataUrl = `data:${contentType};base64,${bytes.toString('base64')}`;

      return NextResponse.json(
        {
          ok: true,
          provider: 'huggingface',
          imageDataUrl,
          width,
          height
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      {
        ok: false,
        error: isAbort ? 'Image generation timed out.' : 'Generation failed.'
      },
      { status: isAbort ? 504 : 500 }
    );
  }
}
