"use client";

import { useRef, useEffect, useState } from "react";
import { getPlatformColors } from "@/lib/platformColors";
import { SaveIcon, UploadIcon, DownloadIcon } from "@/components/icons";

interface Props {
  theme: "dark" | "light";
  previewHtml: string;
  onDownloadHtml: () => void;
  onDownloadPng: () => void;
  onShare: () => void;
  onSaveDraft: () => void;
  isSaving: boolean;
  platform: "instagram" | "facebook" | "linkedin" | "whatsapp";
}

export default function LivePreview({
  theme,
  previewHtml,
  onDownloadHtml,
  onDownloadPng,
  onShare,
  onSaveDraft,
  isSaving,
  platform,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const colors = getPlatformColors(platform);
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Listen for PNG data posted back from the sandboxed iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'PNG_SLIDE_READY') {
        const { dataUrl, filename, index, total } = e.data;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Stop spinner after last slide
        if (index >= total) {
          setIsExporting(false);
          if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
        }
      } else if (e.data?.type === 'PNG_SLIDE_ERROR' || e.data?.type === 'PNG_DONE') {
        setIsExporting(false);
        if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePngClick = () => {
    setIsExporting(true);
    // Safety: always stop spinner after 45s in case iframe fails silently
    if (exportTimerRef.current) clearTimeout(exportTimerRef.current);
    exportTimerRef.current = setTimeout(() => setIsExporting(false), 45000);
    onDownloadPng();
  };

  const isEmpty = !previewHtml;

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dotBg} animate-pulse`} />
          <span className={`text-xs font-mono uppercase tracking-widest ${
            theme === "dark" ? "text-neutral-400" : "text-neutral-500"
          }`}>
            Live preview
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap max-w-full pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={onSaveDraft}
            disabled={isSaving}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-semibold whitespace-nowrap flex-shrink-0 ${
              theme === "dark" ? colors.saveDraftDark : colors.saveDraftLight
            }`}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-label="Saving" />
            ) : (
              <SaveIcon />
            )}
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={onShare}
            disabled={isEmpty}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
              theme === "dark"
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                : "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}
          >
            <UploadIcon />
            Share
          </button>
          <button
            onClick={onDownloadHtml}
            disabled={isEmpty}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              theme === "dark"
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                : "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}
          >
            <DownloadIcon />
            HTML
          </button>
          <button
            onClick={handlePngClick}
            disabled={isEmpty || isExporting}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${colors.pngBtn}`}
          >
            {isExporting ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-label="Exporting" />
            ) : (
              <DownloadIcon />
            )}
            PNG slides
          </button>
        </div>
      </div>

      {/* Preview pane */}
      <div className={`flex-1 rounded-xl overflow-hidden border relative ${
        theme === "dark" ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-neutral-100"
      }`}>
        {isEmpty ? (
          <EmptyState theme={theme} />
        ) : (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="w-full h-full border-none"
            title="Carousel preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {/* Live badge */}
        {!isEmpty && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.badgeDot} animate-pulse`} />
            <span className={`text-[10px] font-mono ${colors.badgeText} uppercase tracking-widest`}>live</span>
          </div>
        )}
      </div>

      {/* Hint */}
      {!isEmpty && (
        <p className={`text-xs text-center ${
          theme === "dark" ? "text-neutral-500" : "text-neutral-400"
        }`}>
          Updates as you type · Scroll horizontally to see all slides
        </p>
      )}
    </div>
  );
}

function EmptyState({ theme }: { theme: "dark" | "light" }) {
  return (
    <div className={`h-full flex flex-col items-center justify-center gap-3 ${
      theme === "dark" ? "text-neutral-600" : "text-neutral-400"
    }`}>
      <svg className="w-10 h-10 stroke-current mb-1" fill="none" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
      <p className="text-sm font-mono tracking-wide">Start typing to see your carousel</p>
    </div>
  );
}

