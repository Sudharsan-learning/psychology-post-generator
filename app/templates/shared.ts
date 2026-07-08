import { Slide, PostConfig } from "@/hooks/useSlides";

export type TemplateBuildFn = (slides: Slide[], config: PostConfig, theme: "dark" | "light") => string;

/**
 * Returns CSS overrides for background image support.
 * Applied when a user uploads a custom background image.
 */
export function getBgImageStyles(config: PostConfig): string {
  if (!config.bgImage) return "";
  return `
  .slide {
    background-image: url(${config.bgImage}) !important;
    background-size: cover !important;
    background-position: center !important;
    position: relative !important;
    z-index: 1 !important;
  }
  .slide::before {
    content: "" !important;
    position: absolute !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.45) !important;
    z-index: -1 !important;
  }
  /* Force light theme elements to white text for readability over background image */
  .slide, 
  .slide .headline, 
  .slide .subtext, 
  .slide .handle span, 
  .slide .footer-row span, 
  .slide .vert, 
  .slide .pn, 
  .slide .action {
    color: #ffffff !important;
  }
  .slide .handle, 
  .slide .role-tag, 
  .slide .eyebrow, 
  .slide .label {
    color: #f3f4f6 !important;
    opacity: 0.9 !important;
  }
  .slide .rule, 
  .slide .margin {
    border-color: rgba(255, 255, 255, 0.25) !important;
  }
  .slide .ticks i {
    background-color: rgba(255, 255, 255, 0.25) !important;
  }
  .slide .cta-box {
    border-color: rgba(255, 255, 255, 0.4) !important;
    background: rgba(0, 0, 0, 0.3) !important;
  }
  .slide .ghost-num {
    color: rgba(255, 255, 255, 0.05) !important;
  }
  `;
}
