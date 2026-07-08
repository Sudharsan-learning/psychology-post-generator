"use client";

import { useRef } from "react";

const BUILTIN_TEMPLATES = [
  {
    id: "clinical",
    name: "Clinical Notes",
    description: "Clean, minimal. Margin strip + serif headlines. Great for structured text.",
    preview: "🗒️",
    accent: "#B07BA1",
  },
  {
    id: "bold",
    name: "Bold Statement",
    description: "High contrast, large type. Great for quotes and single-idea slides.",
    preview: "⬛",
    accent: "#1a1a1a",
  },
  {
    id: "soft",
    name: "Soft Pastel",
    description: "Warm tones, rounded feel. Works well for wellness and self-care topics.",
    preview: "🌸",
    accent: "#B07BA1",
  },
  {
    id: "data",
    name: "Data Visual",
    description: "Green tech/data aesthetic. Roboto Mono headlines with rounded card layout.",
    preview: "📊",
    accent: "#10B981",
  },
  {
    id: "honey",
    name: "Honey Story",
    description: "Warm forest & honey tones. Elegant Cormorant Garamond serif typography.",
    preview: "🍯",
    accent: "#C8860A",
  },
  {
    id: "mango",
    name: "Mango Story",
    description: "Bold mango gold & deep forest palette. Great for product storytelling.",
    preview: "🥭",
    accent: "#F4A829",
  },
];

interface Props {
  theme: "dark" | "light";
  activeTemplate: string;
  onSelectTemplate: (id: string) => void;
  onCustomUpload: (html: string) => void;
}

export default function TemplateGallery({ theme, activeTemplate, onSelectTemplate, onCustomUpload }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith(".html")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const html = ev.target?.result as string;
      if (html) onCustomUpload(html);
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className={`text-xs font-mono uppercase tracking-widest mb-4 ${
          theme === "dark" ? "text-neutral-400" : "text-neutral-500"
        }`}>
          Built-in templates
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {BUILTIN_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className={`group text-left rounded-xl border p-4 transition-all ${
                activeTemplate === tpl.id
                  ? theme === "dark"
                    ? "border-pink-500 bg-pink-950/15 shadow-md shadow-pink-900/10"
                    : "border-pink-500 bg-pink-50/50 shadow-md shadow-pink-200/20"
                  : theme === "dark"
                  ? "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: tpl.accent + "33" }}
                >
                  {tpl.id === "clinical" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: tpl.accent }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : tpl.id === "bold" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ color: "#ffffff" }}>
                      <rect width="14" height="14" x="5" y="5" rx="2" fill="currentColor" />
                    </svg>
                  ) : tpl.id === "data" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: tpl.accent }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zM9 9h2v12H9zM15 5h2v16h-2zM21 1h2v20h-2z" />
                    </svg>
                  ) : tpl.id === "honey" ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ color: tpl.accent }}>
                      <path d="M12 2l2.4 4.2L19 7.5l-3.4 3.6.6 4.9L12 14l-4.2 2l.6-4.9L5 7.5l4.6-1.3L12 2z" fill="currentColor" opacity="0.8" />
                      <path d="M12 14v8M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : tpl.id === "mango" ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ color: tpl.accent }}>
                      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.3" />
                      <circle cx="12" cy="12" r="5" fill="currentColor" opacity="0.7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: tpl.accent }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${
                      theme === "dark" ? "text-neutral-100" : "text-neutral-900"
                    }`}>{tpl.name}</span>
                    {activeTemplate === tpl.id && (
                      <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest">
                        Active
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${
                    theme === "dark" ? "text-neutral-400" : "text-neutral-500"
                  }`}>{tpl.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom upload */}
      <div>
        <h3 className={`text-xs font-mono uppercase tracking-widest mb-4 ${
          theme === "dark" ? "text-neutral-400" : "text-neutral-500"
        }`}>
          Custom template
        </h3>
        <div
          className={`rounded-xl border-2 border-dashed p-8 text-center cursor-not-allowed opacity-50 transition-colors group ${
            theme === "dark"
              ? "border-neutral-800 bg-neutral-900/10"
              : "border-neutral-300 bg-white"
          }`}
        >
          <svg className={`w-8 h-8 mx-auto mb-3 ${
            theme === "dark" ? "text-neutral-500" : "text-neutral-400"
          }`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className={`text-sm font-medium ${
            theme === "dark" ? "text-neutral-300" : "text-neutral-700"
          }`}>Upload .html template (Coming Soon)</p>
          <p className="text-xs text-neutral-500 mt-1">
            Custom template upload and token injection is disabled.
          </p>
        </div>

        {/* Token reference */}
        <div className={`mt-4 rounded-xl p-4 border ${
          theme === "dark"
            ? "bg-neutral-950 border-neutral-900"
            : "bg-neutral-100 border-neutral-200"
        }`}>
          <p className={`text-xs font-mono mb-2 uppercase tracking-widest ${
            theme === "dark" ? "text-neutral-400" : "text-neutral-500"
          }`}>Template tokens</p>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            {[
              "{{author}}",
              "{{slide1_eyebrow}}",
              "{{slide1_headline}}",
              "{{slide1_subtext}}",
              "{{slideN_eyebrow}}",
              "{{slideN_headline}}",
            ].map((token) => (
              <code key={token} className={`text-[11px] px-1.5 py-0.5 rounded ${
                theme === "dark"
                  ? "text-pink-400 bg-neutral-900"
                  : "text-pink-600 bg-white border border-neutral-200"
              }`}>
                {token}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
