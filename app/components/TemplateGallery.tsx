"use client";

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
  {
    id: "developer",
    name: "Developer (Code)",
    description: "Code editor aesthetic. Optimized for coding topics, snippets, and commands.",
    preview: "💻",
    accent: "#39C5CF",
  },
  {
    id: "terminal",
    name: "Terminal (Text)",
    description: "Same developer aesthetic, but designed for plain text and standard content.",
    preview: "⌨️",
    accent: "#58A6FF",
  },
];

interface Props {
  theme: "dark" | "light";
  activeTemplate: string;
  onSelectTemplate: (id: string) => void;
  onCustomUpload: (html: string) => void;
  platform: "instagram" | "facebook" | "linkedin" | "whatsapp";
}

export default function TemplateGallery({ theme, activeTemplate, onSelectTemplate, onCustomUpload, platform }: Props) {
  const styles = getTemplateCardStyles(platform);

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
                    ? styles.activeCardDark
                    : styles.activeCardLight
                  : theme === "dark"
                  ? "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden border border-neutral-800/20 relative shadow-sm">
                  {tpl.id === "clinical" ? (
                    <div className="w-full h-full bg-neutral-900 flex flex-col justify-between p-1.5 border-l-4 border-pink-500">
                      <div className="w-6 h-1 bg-neutral-700 rounded-sm" />
                      <div className="w-8 h-1 bg-neutral-800 rounded-sm" />
                      <div className="w-4 h-1 bg-neutral-800 rounded-sm" />
                    </div>
                  ) : tpl.id === "bold" ? (
                    <div className="w-full h-full bg-neutral-100 flex flex-col items-center justify-center p-1.5">
                      <div className="w-8 h-2.5 bg-black rounded-sm mb-1" />
                      <div className="w-6 h-1 bg-neutral-500 rounded-sm" />
                    </div>
                  ) : tpl.id === "soft" ? (
                    <div className="w-full h-full bg-pink-100/90 flex flex-col justify-between p-1.5 rounded-sm">
                      <div className="w-5 h-1 bg-pink-800/40 rounded-sm" />
                      <div className="w-7 h-1.5 bg-pink-900/60 rounded-sm" />
                      <div className="w-4 h-1 bg-pink-800/40 rounded-sm" />
                    </div>
                  ) : tpl.id === "data" ? (
                    <div className="w-full h-full bg-neutral-950 font-mono flex flex-col justify-between p-1.5 border border-emerald-500/30">
                      <div className="w-8 h-1 bg-emerald-500/50 rounded-sm" />
                      <div className="w-6 h-1 bg-emerald-500/70 rounded-sm" />
                      <div className="w-5 h-1 bg-emerald-500/30 rounded-sm" />
                    </div>
                  ) : tpl.id === "honey" ? (
                    <div className="w-full h-full bg-amber-50 flex flex-col justify-between p-1.5">
                      <div className="w-6 h-1 bg-amber-900/35 rounded-sm" />
                      <div className="w-8 h-1.5 bg-amber-800 rounded-sm" />
                      <div className="w-5 h-1 bg-amber-900/35 rounded-sm" />
                    </div>
                  ) : tpl.id === "mango" ? (
                    <div className="w-full h-full bg-emerald-950 flex flex-col justify-between p-1.5">
                      <div className="w-5 h-1 bg-yellow-500/50 rounded-sm" />
                      <div className="w-8 h-1.5 bg-yellow-500 rounded-sm" />
                      <div className="w-4 h-1 bg-yellow-500/50 rounded-sm" />
                    </div>
                  ) : tpl.id === "developer" || tpl.id === "terminal" ? (
                    <div className="w-full h-full bg-[#0D1117] flex flex-col justify-between p-1.5 border border-[#30363D]">
                      <div className="flex gap-0.5 mb-1">
                        <div className="w-1.5 h-1.5 bg-[#FF5F57] rounded-full" />
                        <div className="w-1.5 h-1.5 bg-[#FFBD2E] rounded-full" />
                        <div className="w-1.5 h-1.5 bg-[#28CA41] rounded-full" />
                      </div>
                      <div className="w-6 h-1 bg-[#58A6FF] rounded-sm" />
                      <div className="w-8 h-1 bg-[#D2A8FF] rounded-sm" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                      <span className="text-xs">✨</span>
                    </div>
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

    </div>
  );
}

const getTemplateCardStyles = (platform: string) => {
  switch (platform) {
    case "facebook":
    case "linkedin":
      return {
        activeCardDark: "border-blue-500 bg-blue-950/15 shadow-md shadow-blue-900/10",
        activeCardLight: "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-200/20",
      };
    case "whatsapp":
      return {
        activeCardDark: "border-green-500 bg-green-950/15 shadow-md shadow-green-900/10",
        activeCardLight: "border-green-50 bg-green-50/50 shadow-md shadow-green-200/20",
      };
    case "instagram":
    default:
      return {
        activeCardDark: "border-pink-500 bg-pink-950/15 shadow-md shadow-pink-900/10",
        activeCardLight: "border-pink-500 bg-pink-50/50 shadow-md shadow-pink-200/20",
      };
  }
};
