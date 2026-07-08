/**
 * Returns the shared inline <script> block for PNG download support.
 * Injected into all template HTML to handle DOWNLOAD_PNG postMessages.
 */
export function getPngDownloadScript(): string {
  return `
  <script src="https://unpkg.com/dom-to-image-more@3.3.0/dist/dom-to-image-more.min.js"></script>
  <script>
    window.addEventListener('message', async (e) => {
      if (e.data?.type === 'DOWNLOAD_PNG') {
        const slides = document.querySelectorAll('.slide');
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const scale = 2.5;
          const dataUrl = await domtoimage.toPng(slide, {
            width: slide.offsetWidth * scale,
            height: slide.offsetHeight * scale,
            style: {
              transform: 'scale(' + scale + ')',
              transformOrigin: 'top left',
              width: slide.offsetWidth + 'px',
              height: slide.offsetHeight + 'px'
            }
          });
          const link = document.createElement('a');
          link.download = \`slide-\${i + 1}.png\`;
          link.href = dataUrl;
          link.click();
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
    });
  </script>`;
}
