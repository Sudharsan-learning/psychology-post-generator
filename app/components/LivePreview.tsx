"use client";

import { useRef, useCallback } from "react";

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
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
              </svg>
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3-3m0 0l3 3m-3-3v11.25" />
            </svg>
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
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            HTML
          </button>
          <button
            onClick={onDownloadPng}
            disabled={isEmpty}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${colors.pngBtn}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
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
            sandbox="allow-scripts"
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

const getPlatformColors = (platform: string) => {
  switch (platform) {
    case "facebook":
    case "linkedin":
      return {
        dotBg: "bg-blue-500",
        saveDraftDark: "bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20 disabled:opacity-50",
        saveDraftLight: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 disabled:opacity-50",
        pngBtn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-blue-900/10 transition-all",
        badgeDot: "bg-blue-400",
        badgeText: "text-blue-400",
      };
    case "whatsapp":
      return {
        dotBg: "bg-green-500",
        saveDraftDark: "bg-green-600/10 text-green-400 border-green-500/20 hover:bg-green-600/20 disabled:opacity-50",
        saveDraftLight: "bg-green-50 text-green-600 border-green-100 hover:bg-green-100 disabled:opacity-50",
        pngBtn: "bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-green-900/10 transition-all",
        badgeDot: "bg-green-400",
        badgeText: "text-green-400",
      };
    case "instagram":
    default:
      return {
        dotBg: "bg-pink-500",
        saveDraftDark: "bg-pink-600/10 text-pink-400 border-pink-500/20 hover:bg-pink-600/20 disabled:opacity-50",
        saveDraftLight: "bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100 disabled:opacity-50",
        pngBtn: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-pink-900/10 transition-all",
        badgeDot: "bg-pink-400",
        badgeText: "text-pink-400",
      };
  }
};
