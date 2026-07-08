"use client";

import { useState } from "react";
import { Slide, PostConfig } from "@/hooks/useSlides";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface Props {
  theme: "dark" | "light";
  slides: Slide[];
  config: PostConfig;
  onUpdateSlide: (id: string, field: keyof Slide, value: string) => void;
  onUpdateConfig: (field: keyof PostConfig, value: string) => void;
  onAddSlide: () => void;
  onRemoveSlide: (id: string) => void;
  onMoveSlide: (id: string, direction: "up" | "down") => void;
  isGenerating: boolean;
  chatMessages: Array<{ role: "user" | "assistant"; content: string }>;
  onSendChatMessage: (message: string) => Promise<void>;
  onResetChat: () => void;
}

export default function SlideBuilder({
  theme,
  slides,
  config,
  onUpdateSlide,
  onUpdateConfig,
  onAddSlide,
  onRemoveSlide,
  onMoveSlide,
  isGenerating,
  chatMessages,
  onSendChatMessage,
  onResetChat,
}: Props) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleImageFile = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) onUpdateConfig("bgImage", ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pr-1 relative">

      {/* Post Title */}
      <section className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Post Title
        </label>
        <input
          className="input"
          placeholder="e.g. 5 Signs of Burnout"
          value={config.topic}
          onChange={(e) => onUpdateConfig("topic", e.target.value)}
        />
      </section>

      {/* Author */}
      <section className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Author / handle
        </label>
        <input
          className="input"
          placeholder="e.g. @creator_handle"
          value={config.author}
          onChange={(e) => onUpdateConfig("author", e.target.value)}
        />
      </section>

      {/* Background Image Upload */}
      <section className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-neutral-400 flex items-center justify-between">
          <span>Background Image</span>
          {config.bgImage && (
            <button
              onClick={() => onUpdateConfig("bgImage", "")}
              className="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-normal font-semibold font-sans"
            >
              Remove
            </button>
          )}
        </label>
        {config.bgImage ? (
          <div className={`relative rounded-lg overflow-hidden h-24 border group ${
            theme === "dark" ? "border-neutral-800" : "border-neutral-200"
          }`}>
            <img src={config.bgImage} alt="Background preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleImageFile(file);
                  };
                  input.click();
                }}
                className="text-xs px-3 py-1.5 rounded bg-white text-black font-semibold"
              >
                Change Image
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleImageFile(file);
              };
              input.click();
            }}
            className={`rounded-lg border border-dashed p-4 text-center cursor-pointer transition-colors ${
              theme === "dark"
                ? "border-neutral-800 hover:border-neutral-700 bg-neutral-900/20"
                : "border-neutral-300 hover:border-neutral-400 bg-white"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1 py-1">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-neutral-500 font-medium">Upload background image</span>
            </div>
          </div>
        )}
      </section>

      {/* Content source toggle */}
      <section className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Content source
        </label>
        <div className={`flex rounded-lg overflow-hidden border ${
          theme === "dark" ? "border-neutral-800" : "border-neutral-200"
        }`}>
          {(["custom", "ai"] as const).map((src) => (
            <button
              key={src}
              onClick={() => onUpdateConfig("contentSource", src)}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${
                config.contentSource === src
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : theme === "dark"
                  ? "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                  : "bg-white text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {src === "ai" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4.5-4.5a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    AI Generate
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Custom
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* AI fields */}
      {config.contentSource === "ai" && (
        <section className={`flex flex-col gap-3 p-4 rounded-xl border ${
          theme === "dark" 
            ? "bg-neutral-900/50 border-neutral-800" 
            : "bg-neutral-100 border-neutral-200"
        }`}>
          {/* Goal & Tone (Optional first parameters) */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-dashed border-neutral-800/40">
            <div className="flex flex-col gap-1">
              <label className={`text-[10px] font-mono uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-500" : "text-neutral-400"
              }`}>Goal</label>
              <select className="input text-xs py-1" value={config.goal} onChange={(e) => onUpdateConfig("goal", e.target.value)}>
                <option value="educate">Educate</option>
                <option value="entertain">Entertain</option>
                <option value="inspire">Inspire</option>
                <option value="inform">Inform</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={`text-[10px] font-mono uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-500" : "text-neutral-400"
              }`}>Tone</label>
              <select className="input text-xs py-1" value={config.tone} onChange={(e) => onUpdateConfig("tone", e.target.value)}>
                <option value="professional">Professional</option>
                <option value="warm">Warm</option>
                <option value="bold">Bold</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 text-xs py-2 scroll-smooth">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] rounded-lg px-2.5 py-2 ${
                  msg.role === "user"
                    ? "self-end bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
                    : theme === "dark"
                    ? "self-start bg-neutral-900 border border-neutral-800 text-neutral-200"
                    : "self-start bg-white border border-neutral-200 text-neutral-800 shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Chat Input & Actions */}
          <div className="flex flex-col gap-2">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem("prompt") as HTMLInputElement;
                const text = input.value.trim();
                if (text && !isGenerating) {
                  input.value = "";
                  await onSendChatMessage(text);
                }
              }}
              className="flex gap-2"
            >
              <input
                name="prompt"
                type="text"
                disabled={isGenerating}
                placeholder={chatMessages.length <= 1 ? "e.g. 5 steps to read faster" : "Ask me to modify slides..."}
                className="input flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={isGenerating}
                className="px-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center"
              >
                {isGenerating ? (
                  <span className="animate-spin text-xs font-sans">◌</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>

            {/* Quick action buttons & suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => onSendChatMessage("Make the cover headline more punchy")}
                disabled={isGenerating || chatMessages.length <= 1}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  theme === "dark"
                    ? "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200 hover:bg-neutral-800"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                ✨ Punchier Cover
              </button>
              <button
                type="button"
                onClick={() => onSendChatMessage("Add actionable bullet points to the body text of slide 2")}
                disabled={isGenerating || chatMessages.length <= 1}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  theme === "dark"
                    ? "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200 hover:bg-neutral-800"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                📝 Add steps to Slide 2
              </button>
              <button
                type="button"
                onClick={onResetChat}
                className="text-[10px] px-2 py-1 rounded border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
              >
                Reset Chat
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Slides */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-widest text-neutral-400">
            Slides ({slides.length}/10)
          </label>
          <button
            onClick={onAddSlide}
            disabled={slides.length >= 10}
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 border border-neutral-700 transition-colors"
          >
            + Add slide
          </button>
        </div>

        {slides.map((slide, i) => (
          <SlideCard
            key={slide.id}
            theme={theme}
            slide={slide}
            index={i}
            total={slides.length}
            onUpdate={(field, value) => onUpdateSlide(slide.id, field, value)}
            onRemove={() => onRemoveSlide(slide.id)}
            onMove={(dir) => onMoveSlide(slide.id, dir)}
          />
        ))}
      </section>

      {/* Caption & hashtags */}
      <section className="flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-widest text-neutral-400">Caption</label>
          <button
            onClick={() => {
              const fullCaption = `${config.caption}\n\n${config.hashtags}`.trim();
              if (fullCaption) {
                navigator.clipboard.writeText(fullCaption);
                showToast("Caption copied to clipboard!");
              }
            }}
            className={`text-[10px] px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
              theme === "dark" 
                ? "bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600"
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy Caption
          </button>
        </div>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Write your social post caption…"
          value={config.caption}
          onChange={(e) => onUpdateConfig("caption", e.target.value)}
        />
        <label className="text-xs font-mono uppercase tracking-widest text-neutral-400 mt-2">Hashtags</label>
        <input
          className="input"
          placeholder="#creativity #inspiration"
          value={config.hashtags}
          onChange={(e) => onUpdateConfig("hashtags", e.target.value)}
        />
      </section>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl border border-neutral-800 font-medium">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Slide card ─────────────────────────────────────────────── */
interface CardProps {
  theme: "dark" | "light";
  slide: Slide;
  index: number;
  total: number;
  onUpdate: (field: keyof Slide, value: string) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}

function SlideCard({ theme, slide, index, total, onUpdate, onRemove, onMove }: CardProps) {
  const label = index === 0 ? "Cover" : slide.isCta ? "CTA" : `Slide ${index + 1}`;
  const accent = index === 0 
    ? "border-pink-500/60 shadow-[0_0_10px_rgba(236,72,153,0.15)]" 
    : slide.isCta 
    ? "border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)]" 
    : theme === "dark"
    ? "border-neutral-800"
    : "border-neutral-200";

  return (
    <div className={`rounded-xl border ${accent} ${
      theme === "dark" ? "bg-neutral-900/50" : "bg-white shadow-sm"
    } overflow-hidden`}>
      {/* Card header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
        theme === "dark" ? "bg-neutral-900 border-neutral-800" : "bg-neutral-50 border-neutral-200"
      }`}>
        <span className={`text-xs font-mono uppercase tracking-widest ${
          theme === "dark" ? "text-neutral-400" : "text-neutral-500"
        }`}>{label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className={`p-1.5 rounded disabled:opacity-20 text-neutral-400 transition-colors ${
              theme === "dark" ? "hover:bg-neutral-800" : "hover:bg-neutral-200"
            }`}
            title="Move up"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className={`p-1.5 rounded disabled:opacity-20 text-neutral-400 transition-colors ${
              theme === "dark" ? "hover:bg-neutral-800" : "hover:bg-neutral-200"
            }`}
            title="Move down"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {total > 1 && (
            <button
              onClick={onRemove}
              className={`p-1.5 rounded transition-colors ml-1 ${
                theme === "dark"
                  ? "hover:bg-red-950/50 text-neutral-500 hover:text-red-400"
                  : "hover:bg-red-50 text-neutral-400 hover:text-red-600"
              }`}
              title="Remove slide"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Card fields */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <Field
          theme={theme}
          label="Eyebrow"
          value={slide.eyebrow}
          placeholder="e.g. This week's read"
          onChange={(v) => onUpdate("eyebrow", v)}
        />
        <Field
          theme={theme}
          label="Headline"
          value={slide.headline}
          placeholder="e.g. The stigma men carry"
          onChange={(v) => onUpdate("headline", v)}
          large
        />
        {slide.isCta ? (
          <Field
            theme={theme}
            label="CTA text"
            value={slide.ctaText ?? ""}
            placeholder="e.g. Save this. Share it with someone who needs it."
            onChange={(v) => onUpdate("ctaText", v)}
          />
        ) : (
          <Field
            theme={theme}
            label="Body text"
            value={slide.subtext}
            placeholder="Supporting sentence or insight…"
            onChange={(v) => onUpdate("subtext", v)}
            multiline
          />
        )}
      </div>
    </div>
  );
}

function Field({
  theme, label, value, placeholder, onChange, large, multiline,
}: {
  theme: "dark" | "light";
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  large?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-[10px] font-mono uppercase tracking-widest ${
        theme === "dark" ? "text-neutral-500" : "text-neutral-400"
      }`}>{label}</span>
      {multiline ? (
        <textarea
          className="input resize-none text-sm"
          rows={2}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={`input ${large ? "text-base font-semibold" : "text-sm font-medium"}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
