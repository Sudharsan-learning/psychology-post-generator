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

      // Inject platform aspect ratio & size overrides, and a script to auto-scale slides to fit viewport vertically without scrollbars
      const sizeOverride = `
      <style>
        ${getPlatformSizeOverrides(config.platform)}
      </style>
      <script>
        (function() {
          window.addEventListener('DOMContentLoaded', () => {
            const slides = Array.from(document.querySelectorAll('.slide'));
            if (slides.length === 0) return;
            
            const container = document.createElement('div');
            container.className = 'slides-container';
            container.style.display = 'flex';
            container.style.gap = '20px';
            container.style.transformOrigin = 'top left';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';
            document.body.style.width = '100vw';
            document.body.style.height = '100vh';
            document.body.style.position = 'relative';
            
            slides[0].parentNode.insertBefore(container, slides[0]);
            slides.forEach(slide => container.appendChild(slide));
            
            const scrollWrapper = document.createElement('div');
            scrollWrapper.className = 'scroll-wrapper';
            scrollWrapper.style.width = '100%';
            scrollWrapper.style.height = '100%';
            scrollWrapper.style.overflowX = 'auto';
            scrollWrapper.style.overflowY = 'hidden';
            scrollWrapper.style.position = 'relative';
            scrollWrapper.style.display = 'flex';
            scrollWrapper.style.alignItems = 'center';
            scrollWrapper.style.padding = '10px';
            
            container.parentNode.insertBefore(scrollWrapper, container);
            scrollWrapper.appendChild(container);
            
            const spacer = document.createElement('div');
            spacer.className = 'scroll-spacer';
            spacer.style.flex = '0 0 auto';
            spacer.style.pointerEvents = 'none';
            spacer.style.opacity = '0';
            scrollWrapper.appendChild(spacer);
            
            function layout() {
              const paddingY = 20; // padding top + bottom
              const parentHeight = scrollWrapper.clientHeight - paddingY;
              const slideHeight = slides[0].offsetHeight || 400;
              const slideWidth = slides[0].offsetWidth || 320;
              
              let scale = 1;
              if (parentHeight < slideHeight) {
                scale = parentHeight / slideHeight;
              }
              
              container.style.transform = \`scale(\${scale})\`;
              
              const totalOriginalWidth = slideWidth * slides.length + 20 * (slides.length - 1);
              const scaledWidth = totalOriginalWidth * scale;
              
              container.style.width = \`\${totalOriginalWidth}px\`;
              container.style.height = \`\${slideHeight}px\`;
              
              const topOffset = (scrollWrapper.clientHeight - slideHeight * scale) / 2;
              container.style.top = \`\${topOffset}px\`;
              container.style.left = '10px';
              
              spacer.style.width = \`\${scaledWidth + 20}px\`;
              spacer.style.height = \`\${slideHeight * scale}px\`;
            }
            
            layout();
            window.addEventListener('resize', layout);
            setTimeout(layout, 100);
          });
        })();
      </script>
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
