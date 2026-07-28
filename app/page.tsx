"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSlides } from "@/hooks/useSlides";
import { useLivePreview } from "@/hooks/useLivePreview";
import { usePostActions } from "@/hooks/usePostActions";
import SlideBuilder from "@/components/SlideBuilder";
import LivePreview from "@/components/LivePreview";
import TemplateGallery from "@/components/TemplateGallery";
import SavedPosts from "@/components/SavedPosts";
import OnboardingModal from "@/components/OnboardingModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppSkeleton from "@/components/AppSkeleton";
import { Toast, ConfirmModal } from "@/components/ui";
import { getPlatformBranding, getPlatformColors } from "@/lib/platformColors";
import {
  GalleryIcon, EditIcon, BookmarkIcon, EyeIcon,
  SunIcon, MoonIcon, InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
} from "@/components/icons";
import type { ChatMessage } from "@/types/chat";

type Tab = "gallery" | "creator" | "preview" | "saved";

const TABS: { id: Tab; label: string }[] = [
  { id: "gallery", label: "Gallery" },
  { id: "creator", label: "Creator" },
  { id: "saved", label: "Saved Drafts" },
  { id: "preview", label: "Preview" },
];

const TAB_ICONS: Record<Tab, (size?: string) => React.ReactNode> = {
  gallery: (s = "w-4 h-4") => <GalleryIcon className={s} />,
  creator: (s = "w-4 h-4") => <EditIcon className={s} />,
  saved: (s = "w-4 h-4") => <BookmarkIcon className={s} />,
  preview: (s = "w-4 h-4") => <EyeIcon className={s} />,
};

const PLATFORM_ICONS: Record<string, (c: string) => React.ReactNode> = {
  instagram: (c) => <InstagramIcon className={c} />,
  facebook: (c) => <FacebookIcon className={c} />,
  linkedin: (c) => <LinkedInIcon className={c} />,
  whatsapp: (c) => <WhatsAppIcon className={c} />,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  whatsapp: "Whatsapp",
};

export default function Home() {
  const router = useRouter();
  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const [activeTab, setActiveTab] = useState<Tab>("creator");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const {
    slides, setSlides, config, activeTemplate, customTemplateHtml,
    isGenerating, setIsGenerating,
    setActiveTemplate, setCustomTemplateHtml,
    updateSlide, updateConfig, addSlide, removeSlide, moveSlide,
    currentPostId, setCurrentPostId, setConfig, resetSlides,
    chatMessages, setChatMessages,
    undo, redo,
  } = useSlides();

  const previewHtml = useLivePreview(slides, config, activeTemplate, customTemplateHtml, theme);

  const {
    isSaving, toast, clearToast, showToast,
    handleDownloadHtml, handleDownloadPng, handleShare, handleSaveDraft,
    handleLoadPost: baseHandleLoadPost, handleNewPost: baseHandleNewPost,
  } = usePostActions({
    currentPostId, slides, config, activeTemplate, chatMessages, previewHtml,
    setCurrentPostId, setSlides, setConfig, setActiveTemplate,
    setCustomTemplateHtml, setChatMessages, resetSlides,
  });

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        handleSaveDraft();
      } else if (key === "z") {
        e.preventDefault();
        undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveDraft, undo, redo]);

  // Wrap load/new to also switch tabs
  const handleLoadPost = useCallback(
    (...args: Parameters<typeof baseHandleLoadPost>) => {
      baseHandleLoadPost(...args);
      setActiveTab("creator");
    },
    [baseHandleLoadPost]
  );
  const handleNewPost = useCallback(() => {
    baseHandleNewPost();
    setActiveTab("creator");
  }, [baseHandleNewPost]);

  // ─── AI Chat Handler ────────────────────────────────────────────────────
  const handleSendChatMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;
      const newUserMessage: ChatMessage = { role: "user", content: messageText };
      const updatedMessages = [...chatMessages, newUserMessage];
      setChatMessages(updatedMessages);
      setIsGenerating(true);

      try {
        const res = await fetch("/api/generate-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            currentSlides: slides,
            caption: config.caption,
            hashtags: config.hashtags,
            activeTemplate,
            platform: config.platform,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Generation failed");
        }

        const data = await res.json();
        if (data.success) {
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.assistant_message || "Done! Slides updated." },
          ]);
          if (data.post?.slides && Array.isArray(data.post.slides)) {
            setSlides(
              data.post.slides.map((s: Record<string, unknown>) => ({
                id: (s.id as string) || crypto.randomUUID(),
                eyebrow: (s.eyebrow as string) || "",
                headline: (s.headline as string) || "",
                subtext: (s.subtext as string) || "",
                isCta: !!s.isCta,
                ctaText: (s.ctaText as string) || "",
              }))
            );
          }
          if (data.post?.caption) updateConfig("caption", data.post.caption);
          if (Array.isArray(data.post?.hashtags)) {
            updateConfig("hashtags", data.post.hashtags.join(" "));
          }
        } else {
          throw new Error(data.error || "Failed to process message");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ Error: ${msg}. Please try again.` },
        ]);
      } finally {
        setIsGenerating(false);
      }
    },
    [chatMessages, slides, config, activeTemplate, setSlides, updateConfig, setIsGenerating, setChatMessages]
  );

  const resetChat = useCallback(() => {
    setChatMessages([
      { role: "assistant", content: "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!" },
    ]);
  }, [setChatMessages]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  // Show skeleton while Clerk loads or if not signed in
  if (!clerkLoaded || !isSignedIn) return <AppSkeleton />;

  const username = user?.username || user?.primaryEmailAddress?.emailAddress || "creator";
  const brand = getPlatformBranding(config.platform || "instagram", theme);
  const colors = getPlatformColors(config.platform || "instagram");

  return (
    <ErrorBoundary>
      <div
        className={`flex h-screen overflow-hidden font-sans flex-col md:flex-row ${theme} ${
          theme === "dark" ? "bg-black text-neutral-100" : "bg-neutral-50 text-neutral-800"
        }`}
      >
        <h1 className="sr-only">SwipePosts Workspace — AI-Powered Social Media Carousel Generator</h1>
        <OnboardingModal theme={theme} />

        {/* Toast notification */}
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={clearToast} />
        )}

        {/* ── Mobile Header ─────────────────────────────────────────────── */}
        <header
          className={`md:hidden px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
            theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${brand.gradient} p-[1.5px] flex items-center justify-center flex-shrink-0 shadow-sm ${brand.shadow}`}>
              <div className={`w-full h-full rounded-[4.5px] ${brand.bg} flex items-center justify-center ${brand.iconColor}`}>
                {PLATFORM_ICONS[config.platform || "instagram"]("w-4 h-4")}
              </div>
            </div>
            <span className={`text-sm font-bold tracking-wide ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>
              SwipePosts
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg border text-sm flex items-center justify-center ${
              theme === "dark"
                ? "border-neutral-800 text-yellow-400 bg-neutral-900"
                : "border-neutral-200 text-purple-600 bg-neutral-100"
            }`}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-purple-600" />}
          </button>
        </header>

        {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
        <aside
          className={`transition-all duration-300 flex-shrink-0 border-r flex flex-col hidden md:flex ${
            isSidebarCollapsed ? "w-16" : "w-56"
          } ${
            theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
          }`}
        >
          <div className={`px-4 py-5 border-b flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between"} ${theme === "dark" ? "border-neutral-800" : "border-neutral-200"}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${brand.gradient} p-[2px] flex items-center justify-center flex-shrink-0 shadow-sm ${brand.shadow}`}>
                  <div className={`w-full h-full rounded-[6px] ${brand.bg} flex items-center justify-center ${brand.iconColor}`}>
                    {PLATFORM_ICONS[config.platform || "instagram"]("w-4 h-4")}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold leading-none tracking-wide truncate ${theme === "dark" ? "text-white" : "text-neutral-900"}`}>SwipePosts</p>
                  <p className={`text-[10px] mt-0.5 font-mono ${theme === "dark" ? "text-neutral-500" : "text-neutral-400"}`}>Social Post Maker</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1.5 rounded-lg border text-xs flex items-center justify-center transition-colors ${
                theme === "dark"
                  ? "border-neutral-800 text-neutral-400 bg-neutral-900 hover:bg-neutral-800"
                  : "border-neutral-200 text-neutral-500 bg-neutral-100 hover:bg-neutral-200/50"
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 flex flex-col gap-1.5" aria-label="Main navigation">
            {TABS.filter((t) => t.id !== "preview").map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${
                    isSidebarCollapsed ? "justify-center" : "text-left"
                  } ${
                    isActive
                      ? theme === "dark"
                        ? `bg-neutral-900 text-white font-bold border-l-4 ${brand.border} pl-2`
                        : `bg-neutral-100 text-neutral-950 font-bold border-l-4 ${brand.border} pl-2`
                      : theme === "dark"
                      ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50"
                      : "text-neutral-550 hover:text-neutral-800 hover:bg-neutral-100/50"
                  }`}
                  title={isSidebarCollapsed ? tab.label : undefined}
                >
                  <span className="flex-shrink-0">{TAB_ICONS[tab.id]()}</span>
                  {!isSidebarCollapsed && <span>{tab.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className={`px-3 py-4 border-t flex flex-col gap-2.5 ${theme === "dark" ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"}`}>
            {!isSidebarCollapsed && (
              <div className="px-3 min-w-0">
                <p className={`text-xs font-mono truncate ${theme === "dark" ? "text-neutral-500" : "text-neutral-400"}`}>{username}</p>
              </div>
            )}
            <div className={`flex ${isSidebarCollapsed ? "flex-col items-center" : "flex-row"} gap-2`}>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg border text-sm flex items-center justify-center transition-colors ${
                  isSidebarCollapsed ? "w-10 h-10" : "flex-1"
                } ${
                  theme === "dark"
                    ? "border-neutral-800 text-yellow-400 bg-neutral-900 hover:bg-neutral-800"
                    : "border-neutral-200 text-purple-600 bg-neutral-100 hover:bg-neutral-200/50"
                }`}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-purple-600" />}
                {!isSidebarCollapsed && <span className="ml-2 font-medium text-xs">Theme</span>}
              </button>

              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg text-xs font-medium transition-colors border flex items-center justify-center ${
                  isSidebarCollapsed ? "w-10 h-10 border-transparent text-neutral-500 hover:text-red-400 hover:bg-red-950/20" : "flex-1 border-neutral-850 hover:bg-red-950/10 text-neutral-400 hover:text-red-400"
                }`}
                title={isSidebarCollapsed ? "Log out" : undefined}
                aria-label="Log out"
              >
                {isSidebarCollapsed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                ) : (
                  "Log out"
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className={`flex-1 flex overflow-hidden flex-col md:flex-row ${theme === "dark" ? "bg-black" : "bg-neutral-50"}`}>
          {/* Left Panel — Workspace / Post Builder */}
          <div
            className={`${
              activeTab === "preview" ? "hidden md:flex" : "flex flex-1 w-full"
            } flex-col overflow-hidden ${
              theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
            }`}
          >
            {/* Section Header + Platform Selector */}
            <div className={`px-6 py-4 border-b flex flex-col gap-3.5 ${theme === "dark" ? "border-neutral-800" : "border-neutral-200"}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xs font-mono uppercase tracking-widest ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>
                  {activeTab === "gallery" ? "Template gallery" : activeTab === "saved" ? "Saved drafts" : "Post builder"}
                </h2>
              </div>
              {activeTab === "creator" && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {(["instagram", "linkedin", "facebook", "whatsapp"] as const).map((plat) => {
                    const isActive = config.platform === plat;
                    const platBrand = getPlatformBranding(plat, theme);
                    return (
                      <button
                        key={plat}
                        onClick={() => updateConfig("platform", plat)}
                        aria-pressed={isActive}
                        className={`flex-1 min-w-[70px] py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all border flex items-center justify-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                          isActive
                            ? theme === "dark"
                              ? "bg-neutral-900 text-white border-neutral-800 shadow-sm"
                              : "bg-neutral-100 text-neutral-900 border-neutral-200 shadow-sm"
                            : theme === "dark"
                            ? "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-900/40"
                            : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-800 hover:bg-neutral-100/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${platBrand.gradient}`} />
                        <span>{PLATFORM_LABELS[plat]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5">
              {activeTab === "gallery" ? (
                <TemplateGallery
                  theme={theme}
                  activeTemplate={activeTemplate}
                  onSelectTemplate={(id) => {
                    setActiveTemplate(id);
                    setCustomTemplateHtml(null);
                    setActiveTab("creator");
                  }}
                  onCustomUpload={(html) => {
                    setCustomTemplateHtml(html);
                    setActiveTab("creator");
                  }}
                  platform={config.platform}
                />
              ) : activeTab === "saved" ? (
                <SavedPosts
                  theme={theme}
                  activePostId={currentPostId}
                  onLoadPost={handleLoadPost}
                  onNewPost={handleNewPost}
                  platform={config.platform}
                  onShowToast={showToast}
                />
              ) : (
                <SlideBuilder
                  theme={theme}
                  slides={slides}
                  config={config}
                  onUpdateSlide={updateSlide}
                  onUpdateConfig={updateConfig}
                  onAddSlide={addSlide}
                  onRemoveSlide={removeSlide}
                  onMoveSlide={moveSlide}
                  isGenerating={isGenerating}
                  chatMessages={chatMessages}
                  onSendChatMessage={handleSendChatMessage}
                  onResetChat={resetChat}
                  platform={config.platform}
                />
              )}
            </div>
          </div>

          {/* Right Panel — Live Preview */}
          <div
            className={`${
              activeTab === "preview" ? "flex flex-1 w-full" : "hidden md:flex md:w-[780px] md:flex-shrink-0"
            } border-l border-neutral-800 overflow-hidden px-4 md:px-6 py-4 md:py-5 flex flex-col ${
              theme === "dark" ? "bg-black" : "bg-neutral-50"
            }`}
          >
            <LivePreview
              theme={theme}
              previewHtml={previewHtml}
              onDownloadHtml={handleDownloadHtml}
              onDownloadPng={handleDownloadPng}
              onShare={handleShare}
              onSaveDraft={handleSaveDraft}
              isSaving={isSaving}
              platform={config.platform}
            />
          </div>
        </main>

        {/* ── Mobile Bottom Nav ──────────────────────────────────────────── */}
        <nav
          className={`md:hidden border-t flex justify-around items-center py-2.5 flex-shrink-0 ${
            theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
          }`}
          aria-label="Mobile navigation"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
                  isActive
                    ? `${colors.textAccent} font-bold`
                    : theme === "dark"
                    ? "text-neutral-500 hover:text-neutral-300"
                    : "text-neutral-400 hover:text-neutral-700"
                }`}
              >
                {TAB_ICONS[tab.id]("w-5 h-5")}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </ErrorBoundary>
  );
}
