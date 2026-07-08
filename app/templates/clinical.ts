import { Slide, PostConfig } from "@/hooks/useSlides";
import { getBgImageStyles } from "./shared";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function buildClinicalTemplate(slides: Slide[], config: PostConfig, theme: "dark" | "light"): string {
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
          <div class="margin">
            <div class="vert">${isCover ? "series" : slide.isCta ? "closing note" : "observation"}</div>
            <div class="ticks"><i></i><i></i><i></i><i></i></div>
            <div class="pn">${num}</div>
          </div>
          <div class="main">
            <div class="ghost-num">${num}</div>
            <div class="header-row">
              <div class="handle">@<span>${author}</span></div>
              <div class="role-tag">${isCover ? "Series" : slide.isCta ? "Take action" : "Insight"}</div>
            </div>
            <div class="rule"></div>
            <div class="body-zone">
              ${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ""}
              ${headline ? `<div class="headline">${headline}</div>` : '<div class="headline placeholder">Your headline here…</div>'}
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
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#F6F2E9; --ink:#1E2A22; --ink-soft:#52584E;
    --sage:#6F8F73; --sage-deep:#3F5B43; --sage-faint:#DCE6DC;
    --clay:#B9663E; --line:#D9D2BF;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${bodyBg};font-family:'IBM Plex Sans',sans-serif;padding:24px;display:flex;gap:20px;overflow-x:auto;}
  .slide{flex:0 0 auto;width:320px;height:400px;background:var(--paper);display:flex;box-shadow:0 8px 24px rgba(0,0,0,0.4);color:var(--ink);}
  .margin{width:38px;flex:0 0 38px;border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;padding:20px 0 14px;}
  .margin .ticks{flex:1;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:6px 0;}
  .margin .ticks i{display:block;width:5px;height:1px;background:var(--line);}
  .margin .vert{writing-mode:vertical-rl;transform:rotate(180deg);font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.12em;color:var(--sage-deep);text-transform:uppercase;white-space:nowrap;}
  .margin .pn{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--ink-soft);}
  .main{flex:1;padding:22px 22px 18px;display:flex;flex-direction:column;position:relative;overflow:hidden;}
  .ghost-num{position:absolute;top:-22px;right:-8px;font-family:'IBM Plex Serif',serif;font-weight:600;font-size:130px;line-height:1;color:var(--sage-faint);z-index:0;user-select:none;}
  .header-row{display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;}
  .handle{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.06em;color:var(--ink-soft);}
  .handle span{color:var(--sage-deep);font-weight:500;}
  .role-tag{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--clay);}
  .rule{height:1px;background:var(--line);margin:12px 0 0;position:relative;z-index:1;}
  .body-zone{flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px;position:relative;z-index:1;}
  .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--sage-deep);}
  .headline{font-family:'IBM Plex Serif',serif;font-weight:500;font-size:24px;line-height:1.2;color:var(--ink);}
  .headline.placeholder{color:var(--line);font-style:italic;}
  .subtext{font-size:12px;line-height:1.6;color:var(--ink-soft);}
  .cta-box{border:1px solid var(--ink);padding:11px 13px;display:flex;flex-direction:column;gap:3px;border-radius:6px;}
  .cta-box .label{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--clay);}
  .cta-box .action{font-family:'IBM Plex Serif',serif;font-size:13px;color:var(--ink);}
  .footer-row{border-top:1px solid var(--line);padding-top:10px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;}
  .footer-row span{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.04em;color:var(--ink-soft);}
  .slide.cover{background:var(--ink);color:var(--paper);}
  .slide.cover .margin{border-color:rgba(246,242,233,.16);}
  .slide.cover .margin .vert{color:#9FC1A2;}
  .slide.cover .margin .pn,.slide.cover .margin .ticks i{color:rgba(246,242,233,.4);}
  .slide.cover .margin .ticks i{background:rgba(246,242,233,.2);}
  .slide.cover .ghost-num{color:rgba(246,242,233,.05);}
  .slide.cover .handle{color:rgba(246,242,233,.6);}
  .slide.cover .handle span{color:#9FC1A2;}
  .slide.cover .role-tag{color:#D9875E;}
  .slide.cover .rule{background:rgba(246,242,233,.16);}
  .slide.cover .eyebrow{color:#9FC1A2;}
  .slide.cover .headline{color:var(--paper);font-size:28px;}
  .slide.cover .headline.placeholder{color:rgba(246,242,233,.2);}
  .slide.cover .subtext{color:rgba(246,242,233,.72);}
  .slide.cover .footer-row{border-color:rgba(246,242,233,.16);}
  .slide.cover .footer-row span{color:rgba(246,242,233,.6);}
  ${getBgImageStyles(config)}
</style>
</head>
<body>
  ${slideHtml}
  ${getPngDownloadScript()}
</body>
</html>`;
}
