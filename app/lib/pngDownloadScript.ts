/**
 * Returns the shared inline <script> block for PNG download support.
 * Injected into all template HTML to handle DOWNLOAD_PNG postMessages.
 *
 * Uses the self-hosted /dom-to-image-more.min.js from public/ instead of
 * the unpkg CDN to eliminate:
 *   1. External CDN dependency (PNG export worked even offline/CDN down)
 *   2. Version mismatch (previously pinned to 3.3.0, package.json had 3.10.0)
 *   3. CSP violation risk from loading third-party scripts
 */
export function getPngDownloadScript(): string {
  return `
  <script src="/dom-to-image-more.min.js"></script>
  <script>
    window.addEventListener('message', async (e) => {
      if (e.data?.type !== 'DOWNLOAD_PNG') return;
      const slides = document.querySelectorAll('.slide');
      if (!slides.length) return;

      const total = slides.length;
      for (let i = 0; i < total; i++) {
        const slide = slides[i];
        const scale = 32; // Increased from 2.5 to prevent pixelation
        try {
          const dataUrl = await domtoimage.toPng(slide, {
            width: slide.offsetWidth * scale,
            height: slide.offsetHeight * scale,
            ignoreCSSRuleErrors: true,
            disableEmbedFonts: true,
            style: {
              transform: 'scale(' + scale + ')',
              transformOrigin: 'top left',
              width: slide.offsetWidth + 'px',
              height: slide.offsetHeight + 'px'
            }
          });
          // Post data URL back to parent — sandboxed iframes cannot trigger downloads directly
          window.parent.postMessage({
            type: 'PNG_SLIDE_READY',
            index: i + 1,
            total: total,
            dataUrl: dataUrl,
            filename: \`slide-\${i + 1}.png\`
          }, '*');
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error('PNG export failed for slide ' + (i + 1) + ':', err);
          window.parent.postMessage({ type: 'PNG_SLIDE_ERROR', index: i + 1 }, '*');
        }
      }
    });
  </script>`;
}
