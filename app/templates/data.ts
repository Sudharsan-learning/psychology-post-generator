import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildDataTemplate(slides: Slide[], config: PostConfig, theme: "dark" | "light"): string {
  const bodyBg = theme === "dark" ? "#111" : "#fafafa";
  const author = escapeHtml(config.author || "creator_handle");

  const slideHtml = slides
    .map((slide, i) => {
      const num = String(i + 1).padStart(2, "0");
      const total = String(slides.length).padStart(2, "0");
      const eyebrow = escapeHtml(slide.eyebrow);
      const headline = escapeHtml(slide.headline);
      const subtext = escapeHtml(slide.subtext);
      const ctaText = escapeHtml(slide.ctaText ?? "");

      return `
        <div class="slide" data-slide="${i}">
          <div class="header-row">
            <div class="handle">@<span>${author}</span></div>
            <div class="pn">${num}</div>
          </div>
          ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
          ${headline ? `<div class="headline">${headline}</div>` : `<div class="headline placeholder">Your headline here…</div>`}
          ${slide.isCta && ctaText
            ? `<div class="cta-box"><div class="label">Next step</div><div class="action">${ctaText}</div></div>`
            : subtext
            ? `<div class="subtext">${subtext}</div>`
            : ""}
          <div class="footer-row">
            <span>${author}</span>
            <span>${num} / ${total}</span>
          </div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #F0FDF4;
    --text: #064E3B;
    --accent: #10B981;
    --border: #A7F3D0;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${bodyBg};font-family:'Inter',sans-serif;padding:24px;display:flex;gap:20px;overflow-x:auto;}
  .slide{
    flex:0 0 auto;
    width:320px;
    height:400px;
    background:var(--bg);
    position:relative;
    overflow:hidden;
    box-shadow:0 8px 24px rgba(0,0,0,0.4);
    color:var(--text);
    padding:26px;
    display:flex;
    flex-direction:column;
    border:7px solid var(--bg);
    border-radius:18px;
  }
  .slide::after {
    content:'';
    position:absolute;
    inset:0;
    border:2px solid var(--border);
    pointer-events:none;
    border-radius:11px;
  }
  .header-row {
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-bottom:1px solid var(--border);
    padding-bottom:12px;
    margin-bottom:16px;
  }
  .handle {
    font-family:'Roboto Mono',monospace;
    font-size:9px;
    font-weight:700;
  }
  .pn {
    font-family:'Roboto Mono',monospace;
    font-size:10px;
    background:var(--accent);
    color:white;
    padding:2px 6px;
    border-radius:4px;
  }
  .eyebrow {
    font-family:'Roboto Mono',monospace;
    font-size:10px;
    text-transform:uppercase;
    color:var(--accent);
    margin-bottom:8px;
  }
  .headline {
    font-size:22px;
    font-weight:600;
    line-height:1.2;
    margin-bottom:16px;
  }
  .headline.placeholder{color:var(--border);font-style:italic;}
  .subtext {
    font-size:12px;
    line-height:1.6;
    background:white;
    padding:14px;
    border-radius:8px;
    border:1px solid var(--border);
    flex-grow:1;
  }
  .cta-box{
    border:1px solid var(--accent);
    background:white;
    padding:12px;
    display:flex;
    flex-direction:column;
    gap:3px;
    border-radius:8px;
    flex-grow:1;
  }
  .cta-box .label{
    font-family:'Roboto Mono',monospace;
    font-size:9px;
    text-transform:uppercase;
    color:var(--accent);
    font-weight:700;
  }
  .cta-box .action{
    font-size:12px;
    color:var(--text);
  }
  .footer-row {
    margin-top:16px;
    display:flex;
    justify-content:space-between;
    font-family:'Roboto Mono',monospace;
    font-size:8px;
    opacity:0.6;
    border-top:1px dashed var(--border);
    padding-top:12px;
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
