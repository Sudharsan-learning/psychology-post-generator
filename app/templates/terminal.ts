import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildTerminalTemplate(
  slides: Slide[],
  config: PostConfig,
  theme: "dark" | "light"
): string {
  const bodyBg = theme === "dark" ? "#090D12" : "#0D1117";
  const author = escapeHtml(config.author || "developer_coding_tricks");

  const slideHtml = slides
    .map((slide, i) => {
      const num = String(i + 1).padStart(2, "0");
      const total = String(slides.length).padStart(2, "0");
      const isCover = i === 0;
      const isLast = i === slides.length - 1;
      const eyebrow = escapeHtml(slide.eyebrow);
      const headline = escapeHtml(slide.headline);
      const subtext = escapeHtml(slide.subtext);
      const ctaText = escapeHtml(slide.ctaText ?? "");

      // Line numbers for the content area
      const lineNums = Array.from({ length: 10 }, (_, n) => `<span>${n + 1}</span>`).join("");

      if (isCover) {
        return `
        <div class="slide cover" data-slide="${i}">
          <!-- Window chrome -->
          <div class="win-chrome">
            <div class="dots"><span class="d r"></span><span class="d y"></span><span class="d g"></span></div>
            <div class="win-title">${eyebrow || "index.js"}</div>
            <div class="win-right">bash</div>
          </div>
          <!-- Terminal body -->
          <div class="terminal-body">
           <div class="term-line"><span class="prompt">$</span> <span class="cmd">coding</span> <span class="arg">tricks</span></div>
            <div class="term-line dim">// @${author}</div>
            <div class="term-gap"></div>
            <div class="cover-headline">
              ${headline
                ? `<span class="text" style="font-weight: 600; font-size: 1.1em;">${headline}</span>`
                : `<span class="placeholder">// Your topic here…</span>`}
            </div>
            ${subtext ? `<div class="cover-sub"><span class="text">${subtext}</span></div>` : ""}
            <div class="term-gap"></div>
            <div class="term-gap"></div>
            <div class="cursor-row"><span class="prompt">$</span> <span class="cursor">▋</span></div>
          </div>
          <!-- Footer -->
          <div class="slide-footer">
            <span class="handle">@${author}</span>
            <span class="pg">${num} / ${total}</span>
          </div>
        </div>`;
      }

      if (slide.isCta) {
        return `
        <div class="slide cta-slide" data-slide="${i}">
          <div class="win-chrome">
            <div class="dots"><span class="d r"></span><span class="d y"></span><span class="d g"></span></div>
            <div class="win-title">action</div>
            <div class="win-right">bash</div>
          </div>
          <div class="terminal-body cta-body">
           
            <div class="cta-headline">${headline || "Found this helpful?"}</div>
            <div class="cta-quote">${subtext || ctaText || "Drop a follow for more daily content."}</div>
            
            <div class="cta-buttons">
              <div class="cta-btn primary">Follow @${author}</div>
              <div class="cta-btn secondary">Save for later 📌</div>
            </div>
          </div>
          <div class="slide-footer">
            <span class="handle">@${author}</span>
            <span class="pg">${num} / ${total}</span>
          </div>
        </div>`;
      }

      // Content slide: syntax-highlighted code block
      return `
        <div class="slide content-slide" data-slide="${i}">
          <!-- Editor chrome -->
          <div class="win-chrome">
            <div class="dots"><span class="d r"></span><span class="d y"></span><span class="d g"></span></div>
            <div class="win-title">${eyebrow ? eyebrow.toLowerCase().replace(/\s+/g, "_") + "" : "tip_" + num + ".js"}</div>
            <div class="win-num">${num}</div>
          </div>
          <!-- Editor body -->
          <div class="editor-body">
            <div class="line-nums">${lineNums}</div>
            <div class="code-area">
              ${eyebrow ? `<div class="code-line"><span class="comment">// ${eyebrow}</span></div>` : ""}
              <div class="code-line hl-line">
                ${headline
                  ? `<span class="text" style="font-weight: 500;">${headline}</span>`
                  : `<span class="placeholder">// Your headline…</span>`}
              </div>
              ${subtext
                ? subtext.split("\n").map((line, li) =>
                    `<div class="code-line"><span class="text" style="opacity: ${li === 0 ? '0.8' : '1'};">${escapeHtml(line.trim())}</span></div>`
                  ).join("\n")
                : ""}
            </div>
          </div>
          <div class="slide-footer">
            <span class="handle">@${author}</span>
            <span class="pg">${num} / ${total}</span>
          </div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap');</style>
<style>
  /* ── Brand tokens ─────────────────────────────── */
  :root {
    --bg:        #0D1117;   /* GitHub dark */
    --surface:   #161B22;   /* editor surface */
    --surface-2: #1C2128;   /* slightly lighter */
    --border:    #30363D;
    --comment:   #8B949E;
    --text:      #E6EDF3;
    --kw:        #FF7B72;   /* keyword red */
    --fn:        #D2A8FF;   /* function purple */
    --str:       #A5D6FF;   /* string blue */
    --var:       #FFA657;   /* variable orange */
    --num:       #79C0FF;   /* number cyan */
    --green:     #3FB950;   /* output green */
    --prompt:    #58A6FF;   /* prompt blue */
    --yellow:    #E3B341;   /* warning yellow */
    --teal:      #39C5CF;   /* brand teal from logo */
    --ln:        #3C4047;   /* line number */
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${bodyBg};font-family:'Fira Code',monospace;padding:24px;display:flex;gap:20px;overflow-x:auto;}

  /* ── Base slide ───────────────────────────────── */
  .slide{
    flex:0 0 auto;
    width:320px;
    height:400px;
    background:#0d1117;
    position:relative;
    overflow:hidden;
    box-shadow:0 8px 24px rgba(0,0,0,0.4);
    color:var(--text);
    display:flex;
    flex-direction:column;
    border-radius:12px;
    border:1px solid #30363d;
    font-family:'Fira Code',monospace;
  }

  /* ── Window chrome ────────────────────────────── */
  .win-chrome{
    display:flex;
    align-items:center;
    gap:8px;
    background:linear-gradient(to bottom, #21262d, #161b22);
    padding:10px 16px;
    border-bottom:1px solid #0d1117;
    box-shadow:0 1px 3px rgba(0,0,0,0.5);
    flex-shrink:0;
  }
  .dots{ display:flex; gap:6px; }
  .d{
    display:block;
    width:11px; height:11px;
    border-radius:50%;
    box-shadow:inset 0 1px 1px rgba(255,255,255,0.2);
  }
  .d.r{ background:#FF5F57; }
  .d.y{ background:#FFBD2E; }
  .d.g{ background:#28CA41; }
  .win-title{
    flex:1;
    text-align:center;
    font-size:11px;
    font-family:'Fira Code',monospace;
    color:var(--comment);
    letter-spacing:.05em;
    font-weight:500;
  }
  .win-right, .win-num{
    font-size:11px;
    color:var(--ln);
    letter-spacing:.04em;
  }

  /* ── COVER slide ──────────────────────────────── */
  .cover{ background:radial-gradient(circle at top right, #161B22, var(--bg)); }
  .terminal-body{
    flex:1;
    padding:20px 24px 14px;
    display:flex;
    flex-direction:column;
    gap:6px;
    overflow:hidden;
  }
  .term-line{
    font-size:12px;
    color:var(--text);
    line-height:1.6;
    white-space:normal;
  }
  .term-line.dim{ color:var(--comment); }
  .term-gap{ height:12px; }
  .prompt{ color:var(--prompt); font-weight:700; margin-right:6px; font-family:'Fira Code',monospace; }
  .cmd{ color:var(--green); font-family:'Fira Code',monospace; }
  .arg{ color:var(--var); font-family:'Fira Code',monospace; }
  .cursor{ color:var(--teal); animation:blink 1s step-end infinite; }
  @keyframes blink{ 50%{ opacity:0; } }

  .cover-headline{
    font-family:'Fira Code',monospace;
    font-size:22px;
    font-weight:700;
    line-height:1.2;
    color:var(--text);
    margin-top:12px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }
  .cover-sub{
    font-size:14px;
    line-height:1.6;
    margin-top:8px;
    white-space:normal;
    color:var(--comment);
  }
  .cover-close{
    font-size:15px;
    color:var(--text);
    margin-top:4px;
  }
  .cursor-row{
    font-size:14px;
    color:var(--comment);
    margin-top:10px;
    display:flex;
    align-items:center;
    gap:4px;
  }

  /* syntax */
  .text{ color:var(--text); font-family:'Fira Code',monospace; }
  .fn{ color:var(--kw); }
  .fn-name{ color:var(--fn); font-weight:500; }
  .punc{ color:var(--text); opacity:.7; }
  .str{ color:var(--str); }
  .kw{ color:var(--kw); }
  .var{ color:var(--var); }
  .num{ color:var(--num); }
  .comment{ color:var(--comment); font-style:italic; }
  .comment-first{ color:var(--comment); opacity:.8; }
  .log{ color:var(--teal); }
  .method{ color:var(--fn); }
  .placeholder{ color:var(--ln); font-style:italic; }

  /* ── CONTENT slide ────────────────────────────── */
  .content-slide{ background:var(--bg); }
  .editor-body{
    display:flex;
    flex:1;
    overflow:hidden;
    background:radial-gradient(circle at top right, #161B22, transparent);
  }
  .line-nums{
    display:flex;
    flex-direction:column;
    gap:0;
    padding:18px 0;
    width:36px;
    background:rgba(22, 27, 34, 0.5);
    border-right:1px solid rgba(255,255,255,0.05);
    text-align:right;
    flex-shrink:0;
  }
  .line-nums span{
    font-size:11px;
    color:var(--ln);
    line-height:1.8;
    padding-right:10px;
    display:block;
  }
  .code-area{
    flex:1;
    padding:18px 20px;
    display:flex;
    flex-direction:column;
    gap:6px;
    overflow:hidden;
  }
  .code-line{
    font-size:13px;
    line-height:1.7;
    white-space:normal;
    word-break:break-word;
    color:var(--text);
  }
  .hl-line{
    background:linear-gradient(90deg, rgba(87,165,255,0.15), transparent);
    border-left:3px solid var(--prompt);
    padding:10px 14px;
    margin-left:-14px;
    border-radius:4px;
    font-size:16px;
    font-weight:700;
    font-family:'Fira Code',monospace;
    white-space:normal;
    word-break:break-word;
    line-height:1.3;
    margin-bottom:12px;
    margin-top:6px;
  }

  /* ── CTA slide ────────────────────────────────── */
  .cta-body{ 
    padding: 30px 24px; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    text-align: center; 
    gap: 0;
  }
  .cta-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--prompt), var(--teal));
    margin: 0 auto 12px;
    padding: 2px;
    box-shadow: 0 4px 14px rgba(88, 166, 255, 0.2);
  }
  .avatar-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: var(--bg);
    background-image: url('/avatar.png');
    background-size: cover;
    background-position: center;
    border: 2px solid var(--surface);
  }
  .cta-headline{ 
    font-family:'Fira Code',monospace;
    font-size:22px; 
    font-weight:700;
    color:var(--text); 
    margin-bottom:8px; 
    line-height:1.2;
  }
  .cta-quote{ 
    font-family:'Fira Code',monospace;
    font-size:13.5px; 
    color:var(--comment); 
    margin-bottom:24px; 
    line-height: 1.5; 
  }
  .cta-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  .cta-btn {
    padding: 12px 18px;
    border-radius: 8px;
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    font-weight: 600;
    width: 100%;
  }
  .cta-btn.primary {
    background: linear-gradient(90deg, #1f6feb, #39C5CF);
    color: #fff;
    box-shadow: 0 4px 14px rgba(31, 111, 235, 0.3);
  }
  .cta-btn.secondary {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--text);
  }

  /* ── Footer ───────────────────────────────────── */
  .slide-footer{
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:10px 20px;
    background:linear-gradient(to top, #161b22, #0d1117);
    border-top:1px solid rgba(255,255,255,0.05);
    flex-shrink:0;
  }
  .handle{
    font-size:11px;
    color:var(--comment);
    letter-spacing:.04em;
    font-family:'Fira Code',monospace;
    font-weight: 500;
  }
  .pg{
    font-size:11px;
    color:var(--ln);
    letter-spacing:.04em;
    font-family:'Fira Code',monospace;
  }

  ${getBgImageStyles(config)}
</style>
</head>
<body>
  ${slideHtml}
  ${getPngDownloadScript()}
</body>
</html>`;
}