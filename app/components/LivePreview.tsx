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
}

export default function LivePreview({
  theme,
  previewHtml,
  onDownloadHtml,
  onDownloadPng,
  onShare,
  onSaveDraft,
  isSaving,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isEmpty = !previewHtml;

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className={`text-xs font-mono uppercase tracking-widest ${
            theme === "dark" ? "text-neutral-400" : "text-neutral-500"
          }`}>
            Live preview
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSaveDraft}
            disabled={isSaving}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-semibold ${
              theme === "dark"
                ? "bg-pink-600/10 text-pink-400 border-pink-500/20 hover:bg-pink-600/20 disabled:opacity-50"
                : "bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100 disabled:opacity-50"
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
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
              theme === "dark"
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                : "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l5.566 2.783m-5.566-2.783a2.25 2.25 0 110-2.186m0 2.186l5.566-2.784m0 0a2.25 2.25 0 113.882 1.514m-3.882-1.514l-5.566 2.784" />
            </svg>
            Share
          </button>
          <button
            onClick={onDownloadHtml}
            disabled={isEmpty}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              theme === "dark"
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                : "bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}
          >
            ↓ HTML
          </button>
          <button
            onClick={onDownloadPng}
            disabled={isEmpty}
            className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-pink-900/10 transition-all"
          >
            ↓ PNG slides
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
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
            <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest">live</span>
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
