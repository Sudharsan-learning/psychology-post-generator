import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildMangoTemplate(slides: Slide[], config: PostConfig, theme: "dark" | "light"): string {
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
        <div class="slide t-cover" data-slide="${i}">
          <div class="inner">
            <div class="top-bar">
              <div class="brand">${author}</div>
              <div class="tag">Series</div>
            </div>
            <div class="headline-block">
              ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
              ${headline ? `<div class="headline">${headline}</div>` : `<div class="headline placeholder">Your headline here…</div>`}
              ${subtext ? `<div class="sub">${subtext}</div>` : ""}
            </div>
            <div class="bottom-bar">
              <div class="handle">@${author}</div>
              <div class="pg">${num} / ${total}</div>
            </div>
          </div>
        </div>`;
      }

      return `
        <div class="slide t-content" data-slide="${i}">
          <div class="inner">
            <div class="top-bar">
              <div class="num">${num}</div>
              <div class="brand-sm">${author}</div>
            </div>
            ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
            ${headline ? `<div class="headline">${headline}</div>` : `<div class="headline placeholder">Your headline here…</div>`}
            ${slide.isCta && ctaText
              ? `<div class="cta-box"><div class="label">Next step</div><div class="action">${ctaText}</div></div>`
              : subtext
              ? `<div class="sub">${subtext}</div>`
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
    --honey: #C8860A;
    --honey-lt: #E8A82A;
    --mango: #F4A829;
    --mango-dk: #D4851A;
    --cream: #FDF8EF;
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
  /* Mango cover */
  .t-cover{background:var(--mango);}
  .t-cover .inner{height:100%;padding:28px;display:flex;flex-direction:column;}
  .t-cover .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:auto;}
  .t-cover .brand{font-family:'Cormorant Garamond',serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:var(--forest);font-weight:600;}
  .t-cover .tag{font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:var(--forest);border:1px solid rgba(27,58,45,0.3);padding:3px 8px;font-weight:400;}
  .t-cover .headline-block{margin-top:auto;margin-bottom:6px;}
  .t-cover .eyebrow{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--forest);font-weight:400;margin-bottom:8px;opacity:0.7;}
  .t-cover .headline{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:38px;line-height:1.06;color:var(--forest);letter-spacing:-0.01em;}
  .t-cover .headline.placeholder{color:rgba(27,58,45,0.3);font-style:italic;}
  .t-cover .sub{font-size:10px;color:var(--text-dk);letter-spacing:0.04em;margin-top:10px;font-weight:300;opacity:0.7;}
  .t-cover .bottom-bar{display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;padding-top:10px;border-top:1px solid rgba(27,58,45,0.15);}
  .t-cover .handle{font-size:8px;letter-spacing:0.06em;color:var(--text-dk);font-weight:300;opacity:0.5;}
  .t-cover .pg{font-size:8px;color:var(--text-dk);opacity:0.4;}
  /* Content slides */
  .t-content{background:var(--cream);}
  .t-content .inner{height:100%;padding:28px;display:flex;flex-direction:column;}
  .t-content .top-bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
  .t-content .num{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:28px;color:var(--mango);line-height:1;}
  .t-content .brand-sm{font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-lt);font-weight:400;}
  .t-content .eyebrow{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--mango-dk);font-weight:500;margin-bottom:6px;}
  .t-content .headline{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:26px;line-height:1.15;color:var(--forest);margin:auto 0;}
  .t-content .headline.placeholder{color:var(--parchment);font-style:italic;}
  .t-content .sub{font-size:10px;color:var(--text-md);line-height:1.6;font-weight:300;}
  .t-content .cta-box{border:1px solid var(--mango);padding:10px;display:flex;flex-direction:column;gap:3px;border-radius:6px;margin-top:auto;}
  .t-content .cta-box .label{font-size:8px;text-transform:uppercase;color:var(--mango-dk);font-weight:600;}
  .t-content .cta-box .action{font-family:'Cormorant Garamond',serif;font-size:12px;color:var(--forest);}
  .t-content .bottom-bar{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--parchment);}
  .t-content .handle{font-size:8px;color:var(--text-lt);letter-spacing:0.06em;}
  .t-content .pg{font-size:8px;color:var(--text-lt);}
  ${getBgImageStyles(config)}
</style>
</head>
<body>
  ${slideHtml}
  ${getPngDownloadScript()}
</body>
</html>`;
}
