'use client';

import { useEffect, useMemo, useState } from 'react';

type Ratio = '1:1' | '2:3' | '9:16';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [prompt, setPrompt] = useState('anime character portrait, clean line art, expressive eyes');
  const [ratio, setRatio] = useState<Ratio>('2:3');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState('');
  const [provider, setProvider] = useState('');
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const downloadName = useMemo(() => {
    if (image.startsWith('data:image/png')) return 'image-forge-output.png';
    if (image.startsWith('data:image/jpeg') || image.startsWith('data:image/jpg')) return 'image-forge-output.jpg';
    return 'image-forge-output.webp';
  }, [image]);

  async function waitForResult(requestId: string) {
    for (let attempt = 0; attempt < 150; attempt += 1) {
      await sleep(attempt === 0 ? 1500 : 4000);

      const res = await fetch(`/api/generate/status?id=${encodeURIComponent(requestId)}`, {
        cache: 'no-store'
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Generation status failed');
      }

      if (data.status === 'complete' && data.imageUrl) {
        setImage(data.imageUrl);
        setProvider(data.provider || 'ai-horde');
        setStatusText(data.model ? `DONE · ${data.model}` : 'DONE');
        return;
      }

      const queue = Number.isFinite(Number(data.queuePosition)) ? ` · queue ${data.queuePosition}` : '';
      const wait = Number.isFinite(Number(data.waitTime)) ? ` · ~${data.waitTime}s` : '';
      setStatusText(`FREE QUEUE${queue}${wait}`);
    }

    throw new Error('The free queue took longer than 10 minutes. Please try again.');
  }

  async function generate() {
    setLoading(true);
    setError('');
    setImage('');
    setProvider('');
    setStatusText('SUBMITTING TO FREE GPU QUEUE...');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ratio })
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.requestId) {
        throw new Error(data.error || 'Generation failed');
      }

      setProvider(data.provider || 'ai-horde-anonymous');
      setStatusText('FREE QUEUE · WAITING FOR A VOLUNTEER GPU...');
      await waitForResult(data.requestId);
    } catch (e) {
      setStatusText('');
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card hero">
        <div className="eyebrow">FREE-FIRST v0.4</div>
        <h1>IMAGE FORGE MOBILE</h1>
        <p>登録・カード・APIキー不要。AI Hordeの匿名無料GPUキューで実画像を生成します。</p>
      </section>

      <section className="card form">
        <label>Prompt</label>
        <textarea value={prompt} maxLength={400} onChange={(e) => setPrompt(e.target.value)} />
        <div className="ratios">
          {(['1:1','2:3','9:16'] as Ratio[]).map((r) => (
            <button key={r} className={ratio === r ? 'active' : ''} onClick={() => setRatio(r)}>{r}</button>
          ))}
        </div>
        <button className="generate" disabled={loading || !prompt.trim()} onClick={generate}>
          {loading ? 'GENERATING...' : 'GENERATE'}
        </button>
        {statusText && <div className="eyebrow">{statusText}</div>}
        {error && <div className="error">{error}</div>}
      </section>

      {image && (
        <section className="card result">
          <div className="eyebrow">PROVIDER: {provider.toUpperCase()}</div>
          <img src={image} alt="Generated output" />
          <a className="save" href={image} download={downloadName} target="_blank" rel="noreferrer">SAVE</a>
        </section>
      )}
    </main>
  );
}
