import { useState, useEffect, useRef } from "react";
import { Slide, PostConfig } from "./useSlides";
import { TEMPLATES, getBgImageStyles } from "@/templates";
import { escapeHtml } from "@/lib/escapeHtml";
import { getPngDownloadScript } from "@/lib/pngDownloadScript";

export function useLivePreview(
  slides: Slide[],
  config: PostConfig,
  activeTemplate: string,
  customTemplateHtml: string | null,
  theme: "dark" | "light"
) {
  const [previewHtml, setPreviewHtml] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      let html: string;

      if (customTemplateHtml) {
        html = injectIntoCustomTemplate(customTemplateHtml, slides, config, theme);
      } else {
        const builder = TEMPLATES[activeTemplate] ?? TEMPLATES.clinical;
        html = builder(slides, config, theme);
      }

      // Inject platform aspect ratio & size overrides dynamically
      const sizeOverride = `
      <style>
        ${getPlatformSizeOverrides(config.platform)}
      </style>
      `;
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${sizeOverride}</head>`);
      } else {
        html = sizeOverride + html;
      }

      setPreviewHtml(html);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slides, config, activeTemplate, customTemplateHtml, theme]);

  return previewHtml;
}

function getPlatformSizeOverrides(platform: string): string {
  switch (platform) {
    case "linkedin":
      return `
      .slide {
        width: 360px !important;
        height: 270px !important;
      }
      `;
    case "facebook":
      return `
      .slide {
        width: 382px !important;
        height: 200px !important;
      }
      `;
    case "whatsapp":
      return `
      .slide {
        width: 225px !important;
        height: 400px !important;
      }
      `;
    case "instagram":
    default:
      return `
      .slide {
        width: 320px !important;
        height: 400px !important;
      }
      `;
  }
}

function injectIntoCustomTemplate(
  templateHtml: string,
  slides: Slide[],
  config: PostConfig,
  theme: "dark" | "light"
): string {
  let html = templateHtml;

  // Escape all user-provided values before injection
  html = html.replace(/\{\{author\}\}/g, escapeHtml(config.author));
  slides.forEach((slide, i) => {
    html = html.replace(new RegExp(`\\{\\{slide${i + 1}_eyebrow\\}\\}`, "g"), escapeHtml(slide.eyebrow));
    html = html.replace(new RegExp(`\\{\\{slide${i + 1}_headline\\}\\}`, "g"), escapeHtml(slide.headline));
    html = html.replace(new RegExp(`\\{\\{slide${i + 1}_subtext\\}\\}`, "g"), escapeHtml(slide.subtext));
  });

  // Inject body theme background style
  const bodyBg = theme === "dark" ? "#111" : "#fafafa";
  const bodyStyleInject = `
  <style>
    body { background: ${bodyBg} !important; }
  </style>
  `;
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${bodyStyleInject}</head>`);
  } else {
    html = bodyStyleInject + html;
  }

  // Inject background image styles if present
  if (config.bgImage) {
    const bgStyleInject = `
    <style>
      ${getBgImageStyles(config)}
    </style>
    `;
    if (html.includes("</head>")) {
      html = html.replace("</head>", `${bgStyleInject}</head>`);
    } else {
      html = bgStyleInject + html;
    }
  }

  // Inject PNG download script before </body>
  const scriptInject = `
  ${getPngDownloadScript()}
  </body>`;

  if (html.includes("</body>")) {
    html = html.replace("</body>", scriptInject);
  } else {
    html = html + scriptInject;
  }

  return html;
}
