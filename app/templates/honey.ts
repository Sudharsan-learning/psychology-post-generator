import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildHoneyTemplate(slides: Slide[], config: PostConfig, theme: "dark" | "light"): string {
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

      if (isCover) {
        return `
        <div class="slide t-forest" data-slide="${i}">
          <div class="inner">
            <div class="top-bar">
              <div class="brand-badge">${author}</div>
              <div class="series-tag">Series</div>
            </div>
            <div class="headline-block">
              ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
              ${headline ? `<div class="headline">${headline}</div>` : `<div class="headline"><span class="placeholder">Your headline here…</span></div>`}
              ${subtext ? `<div class="subline">${subtext}</div>` : ""}
            </div>
            <div class="bottom-bar">
              <div class="handle">@${author}</div>
              <div class="pg">${num} / ${total}</div>
            </div>
          </div>
        </div>`;
      }

      return `
        <div class="slide t-honey" data-slide="${i}">
          <div class="accent-bar"></div>
          <div class="inner">
            <div class="top-bar">
              <div class="brand">${author}</div>
              <div class="tag">${eyebrow || "Insight"}</div>
            </div>
            <div class="rule"></div>
            <div class="product-name">${headline || '<span class="placeholder">Your headline here…</span>'}</div>
            ${slide.isCta && ctaText
              ? `<div class="cta-box"><div class="label">Next step</div><div class="action">${ctaText}</div></div>`
              : subtext
              ? `<div class="tagline">${subtext}</div>`
              : ""}
            <div class="bottom-bar">
              <div class="handle">@${author}</div>
              <div class="pg">${num} / ${total}</div>
            </div>
          </div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --forest: #1B3A2D;
    --forest-2: #244D3A;
    --honey: #C8860A;
    --honey-lt: #E8A82A;
    --mango: #F4A829;
    --cream: #FDF8EF;
    --cream-2: #F5EDD8;
    --parchment: #EDE0C4;
    --text-dk: #1A2218;
    --text-md: #3D4F3A;
    --text-lt: #7A9178;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${bodyBg};font-family:'Jost',sans-serif;padding:24px;display:flex;gap:20px;overflow-x:auto;}
  .slide{
    flex:0 0 360px;
    height:360px;
    position:relative;
    overflow:hidden;
    box-shadow:0 8px 24px rgba(0,0,0,0.4);
  }
  /* Forest cover */
  .t-forest{background:var(--forest);}
  .t-forest .inner{position:relative;z-index:1;height:100%;padding:28px;display:flex;flex-direction:column;}
  .t-forest .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:auto;}
  .t-forest .brand-badge{font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--mango);font-weight:500;}
  .t-forest .series-tag{font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.15);padding:3px 8px;font-weight:300;}
  .t-forest .headline-block{margin-top:auto;margin-bottom:6px;}
  .t-forest .eyebrow{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--honey-lt);font-weight:400;margin-bottom:8px;}
  .t-forest .headline{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:36px;line-height:1.08;color:#fff;letter-spacing:-0.01em;}
  .t-forest .headline .placeholder{color:rgba(255,255,255,0.2);font-style:italic;}
  .t-forest .subline{font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:0.05em;margin-top:10px;font-weight:300;}
  .t-forest .bottom-bar{display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);}
  .t-forest .handle{font-size:8px;letter-spacing:0.08em;color:rgba(255,255,255,0.3);font-weight:300;}
  .t-forest .pg{font-size:8px;letter-spacing:0.06em;color:rgba(255,255,255,0.25);font-weight:300;}
  /* Honey content */
  .t-honey{background:var(--cream);}
  .t-honey .accent-bar{position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(to bottom,var(--honey),var(--mango));}
  .t-honey .inner{position:relative;z-index:1;height:100%;padding:24px 26px 22px 36px;display:flex;flex-direction:column;}
  .t-honey .top-bar{display:flex;justify-content:space-between;align-items:center;}
  .t-honey .brand{font-family:'Cormorant Garamond',serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--forest);font-weight:500;}
  .t-honey .tag{font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:var(--honey);border:1px solid var(--honey);padding:2px 7px;font-weight:400;}
  .t-honey .rule{height:1px;background:linear-gradient(to right,var(--honey),transparent);margin:12px 0;opacity:0.35;}
  .t-honey .product-name{font-family:'Cormorant Garamond',serif;font-size:28px;line-height:1.1;color:var(--forest);font-weight:500;letter-spacing:-0.01em;margin:auto 0;}
  .t-honey .product-name .placeholder{color:var(--parchment);font-style:italic;}
  .t-honey .tagline{font-size:10px;color:var(--text-md);letter-spacing:0.05em;font-weight:300;line-height:1.6;}
  .t-honey .cta-box{border:1px solid var(--honey);padding:10px;display:flex;flex-direction:column;gap:3px;border-radius:6px;}
  .t-honey .cta-box .label{font-size:8px;text-transform:uppercase;color:var(--honey);font-weight:600;}
  .t-honey .cta-box .action{font-family:'Cormorant Garamond',serif;font-size:12px;color:var(--forest);}
  .t-honey .bottom-bar{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--parchment);}
  .t-honey .handle{font-size:8px;color:var(--text-lt);letter-spacing:0.06em;}
  .t-honey .pg{font-size:8px;color:var(--text-lt);}
  ${getBgImageStyles(config)}
</style>
</head>
<body>
  ${slideHtml}
  ${getPngDownloadScript()}
</body>
</html>`;
}
