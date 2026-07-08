import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildSoftTemplate(slides: Slide[], config: PostConfig, theme: "dark" | "light"): string {
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
          <div class="handle">@<span>${author}</span></div>
          <div style="margin: auto 0; padding: 0 10px;">
            ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
            ${headline ? `<div class="headline">"${headline}"</div>` : `<div class="headline placeholder">"Your quote here…"</div>`}
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
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;1,500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #FAF0F5;
    --text: #5C3A4E;
    --accent: #B07BA1;
    --sub: #7A5F6E;
    --line: #EAD5E1;
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
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    padding:40px 30px;
    text-align:center;
    border-radius:20px;
  }
  .handle {
    position: absolute;
    top: 20px;
    left: 0;
    width: 100%;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--sub);
  }
  .handle span { font-weight: bold; color: var(--text); }
  .eyebrow {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--accent);
    margin-bottom: 15px;
    font-weight: 500;
  }
  .headline {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    line-height: 1.3;
    font-style: italic;
    margin-bottom: 15px;
    font-weight: 500;
  }
  .headline.placeholder{color:var(--line);font-style:italic;}
  .subtext {
    font-size: 13px;
    line-height: 1.6;
    color: var(--sub);
    opacity: 0.9;
  }
  .cta-box{
    border: 1px solid var(--accent);
    background: #FFF9FC;
    padding: 10px 15px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    border-radius: 12px;
  }
  .cta-box .label{
    font-size: 9px;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 600;
  }
  .cta-box .action{
    font-family: 'Playfair Display', serif;
    font-size: 12px;
    color: var(--text);
    font-style: italic;
  }
  .footer-row {
    position: absolute;
    bottom: 20px;
    width: 100%;
    left: 0;
    padding: 0 30px;
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--sub);
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
