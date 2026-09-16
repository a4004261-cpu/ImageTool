'use client';

import { useEffect, useMemo, useState } from 'react';

type Ratio = '1:1' | '2:3' | '9:16';

export default function Home() {
  const [prompt, setPrompt] = useState('anime character portrait, clean line art, expressive eyes');
  const [ratio, setRatio] = useState<Ratio>('2:3');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState('');
  const [provider, setProvider] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  const downloadName = useMemo(() => {
    if (image.startsWith('data:image/png')) return 'image-forge-output.png';
    if (image.startsWith('data:image/jpeg') || image.startsWith('data:image/jpg')) return 'image-forge-output.jpg';
    if (image.startsWith('data:image/webp')) return 'image-forge-output.webp';
    return 'image-forge-output.svg';
  }, [image]);

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ratio })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Generation failed');
      setImage(data.imageDataUrl);
      setProvider(data.provider || 'unknown');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card hero">
        <div className="eyebrow">FREE-FIRST v0.3</div>
        <h1>IMAGE FORGE MOBILE</h1>
        <p>HF_TOKEN設定時は実画像生成、未設定時は無料Mockで動作します。</p>
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
          <div className="eyebrow">PROVIDER: {provider.toUpperCase()}</div>
          <img src={image} alt="Generated output" />
          <a className="save" href={image} download={downloadName}>SAVE</a>
        </section>
      )}
    </main>
  );
}
