"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Home() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.action === 'png_ready') {
        setDownloadingPng(false);
        e.data.images.forEach((img: string, i: number) => {
          // Download each slide with a slight delay to allow multiple downloads
          setTimeout(() => {
            const a = document.createElement("a");
            a.href = img;
            a.download = `carousel-slide-${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, i * 300);
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function generatePost() {
    if (!content.trim()) {
      setError("Please enter a psychology topic first!");
      return;
    }

    setLoading(true);
    setError("");
    setPost(null);
    setTemplateHtml("");

    try {
      const res = await axios.post("/api/generate-post", {
        content: content.trim(),
      });
      const data = res.data;

      setPost(data.post);

      // Fetch template and inject data
      const templateRes = await fetch("/post-template.html");
      let html = await templateRes.text();
      
      const p = data.post;
      // Inject slide 1
      html = html.replace('id="s1-eyebrow">This week\'s read<', `id="s1-eyebrow">${p.s1.eyebrow}<`);
      html = html.replace('id="s1-headline">The stigma men <span class="accent">carry</span><', `id="s1-headline">${p.s1.headline}<`);
      html = html.replace('id="s1-subtext">Why silence isn\'t strength — and what it quietly costs. Swipe through.<', `id="s1-subtext">${p.s1.subtext}<`);

      // Inject slide 2
      html = html.replace('id="s2-eyebrow">What we observe<', `id="s2-eyebrow">${p.s2.eyebrow}<`);
      html = html.replace('id="s2-headline">Boys are taught to <span class="mark">fix</span>, not feel.<', `id="s2-headline">${p.s2.headline}<`);
      html = html.replace('id="s2-subtext">From childhood, emotional expression gets read as weakness. The result: distress carried alone, far longer than it should be.<', `id="s2-subtext">${p.s2.subtext}<`);

      // Inject slide 3
      html = html.replace('id="s3-eyebrow">Worth repeating<', `id="s3-eyebrow">${p.s3.eyebrow}<`);
      html = html.replace('id="s3-headline">Asking for help is a <span class="mark">skill</span>, not a flaw.<', `id="s3-headline">${p.s3.headline}<`);
      html = html.replace('id="s3-subtext">Therapy isn\'t a last resort. The earlier it starts, the less there is to undo.<', `id="s3-subtext">${p.s3.subtext}<`);

      // Inject slide 4
      html = html.replace('id="s4-eyebrow">Take this with you<', `id="s4-eyebrow">${p.s4.eyebrow}<`);
      html = html.replace('id="s4-headline">If this is you — start with one sentence.<', `id="s4-headline">${p.s4.headline}<`);
      html = html.replace('id="s4-cta-label">Next step<', `id="s4-cta-label">${p.s4.ctaLabel}<`);
      html = html.replace('id="s4-cta-action">Save this post. Send it to someone who needs it.<', `id="s4-cta-action">${p.s4.ctaAction}<`);

      // Inject html2canvas script for downloading PNGs
      const scriptInjection = `
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <script>
          window.addEventListener('message', async (e) => {
            if (e.data.action === 'download_png') {
              const slides = document.querySelectorAll('.slide');
              const images = [];
              for (let i = 0; i < slides.length; i++) {
                const canvas = await html2canvas(slides[i], { scale: 3, backgroundColor: '#F6F2E9' });
                images.push(canvas.toDataURL('image/png'));
              }
              window.parent.postMessage({ action: 'png_ready', images }, '*');
            }
          });
        </script>
      </body>
      `;
      html = html.replace('</body>', scriptInjection);

      setTemplateHtml(html);

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to generate post. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const downloadHtml = () => {
    const blob = new Blob([templateHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instagram-carousel-preview.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerPngDownload = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setDownloadingPng(true);
      iframeRef.current.contentWindow.postMessage({ action: 'download_png' }, '*');
    }
  };

  return (
    <main className="page-container" style={{ padding: '0 15px' }}>
      <header className="header" style={{ marginTop: '20px' }}>
        <span className="header-icon">🧠</span>
        <h1 className="header-title">PsychPost AI</h1>
        <p className="header-subtitle">
          AI-powered Instagram posts on psychology &amp; human behavior
        </p>
      </header>

      <section className="card input-card">
        <label htmlFor="content-input" className="input-label">
          Enter a psychology topic or idea
        </label>
        <textarea
          id="content-input"
          placeholder="e.g., Why do people fear rejection more than failure? / The psychology behind procrastination..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError("");
          }}
          maxLength={1000}
          className="textarea"
          disabled={loading}
        />
        <div className="textarea-footer">
          <span className="char-count">{content.length}/1000</span>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          id="generate-button"
          onClick={generatePost}
          disabled={loading || !content.trim()}
          className="generate-btn"
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" />
              Generating…
            </span>
          ) : (
            <span>🔬 Generate Carousel Text</span>
          )}
        </button>
      </section>

      {loading && (
        <section className="card skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text short" />
          <div className="skeleton skeleton-image" />
        </section>
      )}

      {post && !loading && (
        <section className="card result-card" style={{ maxWidth: '1200px', width: '100%', padding: '20px 10px' }}>
          <div className="result-badge">✨ Generated Carousel Preview</div>

          {templateHtml && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <iframe
                ref={iframeRef}
                srcDoc={templateHtml}
                style={{ 
                  width: '100%', 
                  height: '560px', // slightly taller to fit padding
                  border: 'none', 
                  borderRadius: '8px', 
                  background: '#0d0d0d',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' 
                }}
                title="Post Template Preview"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="copy-btn"
              onClick={() => {
                const fullPost = `${post.caption}\n\n${post.hashtags.join(" ")}`;
                navigator.clipboard.writeText(fullPost);
                alert("Caption & Hashtags copied to clipboard! 📋");
              }}
            >
              📋 Copy Post Caption
            </button>
            <button 
              className="copy-btn" 
              onClick={triggerPngDownload} 
              disabled={downloadingPng}
              style={{ background: '#3b82f6', color: 'white', opacity: downloadingPng ? 0.7 : 1 }}
            >
              {downloadingPng ? '⏳ Processing PNGs...' : '🖼️ Download as 4 PNGs'}
            </button>
            <button className="copy-btn" onClick={downloadHtml} style={{ background: '#10b981', color: 'white' }}>
              🌐 Download HTML Preview
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
