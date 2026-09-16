'use client';

import { useEffect, useState } from 'react';

type Ratio = '1:1' | '2:3' | '9:16';

export default function Home() {
  const [prompt, setPrompt] = useState('anime character portrait, clean line art, expressive eyes');
  const [ratio, setRatio] = useState<Ratio>('2:3');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  async function generate() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ratio })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Generation failed');
      setImage(data.imageDataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card hero">
        <div className="eyebrow">FREE-FIRST v0.2</div>
        <h1>IMAGE FORGE MOBILE</h1>
        <p>スマホ中心の画像生成フロントエンド。現在は無料Mockモードで配備確認中。</p>
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
        {error && <div className="error">{error}</div>}
      </section>

      {image && (
        <section className="card result">
          <img src={image} alt="Generated mock output" />
          <a className="save" href={image} download="image-forge-output.svg">SAVE</a>
        </section>
      )}
    </main>
  );
}
