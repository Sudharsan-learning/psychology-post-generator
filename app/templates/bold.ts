import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildBoldTemplate(slides: Slide[], config: PostConfig, theme: "dark" | "light"): string {
  const bodyBg = theme === "dark" ? "#111" : "#fafafa";
  const author = escapeHtml(config.author || "creator_handle");

  const slideHtml = slides
    .map((slide, i) => {
      const num = String(i + 1).padStart(2, "0");
      const total = String(slides.length).padStart(2, "0");
      const isCover = i === 0;
      const eyebrow = escapeHtml(slide.eyebrow);
      const headline = escapeHtml(slide.headline);
      const subtext = escapeHtml(slide.subtext);
      const ctaText = escapeHtml(slide.ctaText ?? "");

      return `
        <div class="slide ${isCover ? "cover" : ""}" data-slide="${i}">
          <div class="orb"></div>
          <div class="header-row">
            <div class="handle">@<span>${author}</span></div>
            <div class="pn">${num}</div>
          </div>
          <div style="margin: auto 0;">
            ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
            ${headline ? `<div class="headline">${headline}</div>` : `<div class="headline placeholder">Your headline here…</div>`}
            ${slide.isCta && ctaText
              ? `<div class="cta-box"><div class="label">Next step</div><div class="action">${ctaText}</div></div>`
              : subtext
              ? `<div class="subtext">${subtext}</div>`
              : ""}
          </div>
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
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #111111;
    --text: #F3F4F6;
    --accent: #A78BFA;
    --sub: #9CA3AF;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${bodyBg};font-family:'Outfit',sans-serif;padding:24px;display:flex;gap:20px;overflow-x:auto;}
  .slide{
    flex:0 0 auto;
    width:320px;
    height:400px;
    background:var(--bg);
    position:relative;
    overflow:hidden;
    box-shadow:0 8px 24px rgba(0,0,0,0.4);
    color:var(--text);
    padding:30px;
    display:flex;
    flex-direction:column;
    border-radius:16px;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: auto;
    position: relative;
    z-index: 1;
  }
  .handle {
    font-size: 11px;
    font-weight: 500;
    color: var(--sub);
  }
  .handle span { color: var(--text); }
  .pn {
    font-size: 12px;
    font-weight: 800;
    color: var(--accent);
  }
  .eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--accent);
    margin-bottom: 10px;
    font-weight: 800;
    position: relative;
    z-index: 1;
  }
  .headline {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }
  .headline.placeholder{color:rgba(243,244,246,0.2);font-style:italic;}
  .subtext {
    font-size: 13px;
    line-height: 1.5;
    color: var(--sub);
    font-weight: 300;
    position: relative;
    z-index: 1;
  }
  .cta-box{
    border: 1px solid var(--accent);
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    border-radius: 8px;
    position: relative;
    z-index: 1;
  }
  .cta-box .label{
    font-size: 9px;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 800;
  }
  .cta-box .action{
    font-size: 12px;
    color: var(--text);
  }
  .footer-row {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--sub);
    padding-top: 15px;
    border-top: 1px solid rgba(255,255,255,0.1);
    position: relative;
    z-index: 1;
  }
  .orb {
    position: absolute;
    width: 180px;
    height: 180px;
    background: var(--accent);
    border-radius: 50%;
    filter: blur(70px);
    opacity: 0.15;
    top: -45px;
    right: -45px;
    pointer-events: none;
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
