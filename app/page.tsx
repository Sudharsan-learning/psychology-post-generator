"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSlides } from "@/hooks/useSlides";
import { useLivePreview } from "@/hooks/useLivePreview";
import SlideBuilder from "@/components/SlideBuilder";
import LivePreview from "@/components/LivePreview";
import TemplateGallery from "@/components/TemplateGallery";
import SavedPosts from "@/components/SavedPosts";
import OnboardingModal from "@/components/OnboardingModal";
import ErrorBoundary from "@/components/ErrorBoundary";

type Tab = "gallery" | "creator" | "preview" | "saved";

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  
  const [activeTab, setActiveTab] = useState<Tab>("creator");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
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
  } = useSlides();

  // Live preview — rebuilds 300ms after any slide/config change
  const previewHtml = useLivePreview(slides, config, activeTemplate, customTemplateHtml, theme);

  const username = user?.username || user?.primaryEmailAddress?.emailAddress || "creator";

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  // AI Conversational Send Handler — uses functional state updater to avoid stale closures
  const handleSendChatMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    const newUserMessage = { role: "user" as const, content: messageText };
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
          activeTemplate: activeTemplate,
          platform: config.platform,
        }),
      });

      if (!res.ok) {
        let errMessage = "Generation failed";
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore parse error
        }
        throw new Error(errMessage);
      }

      const data = await res.json();
      if (data.success) {
        const assistantMessageText = data.assistant_message || "Done! I have updated the slides.";
        setChatMessages((prev) => [...prev, { role: "assistant", content: assistantMessageText }]);

        if (data.post) {
          if (data.post.slides && Array.isArray(data.post.slides)) {
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
          if (data.post.caption) {
            updateConfig("caption", data.post.caption);
          }
          if (data.post.hashtags && Array.isArray(data.post.hashtags)) {
            updateConfig("hashtags", data.post.hashtags.join(" "));
          }
        }
      } else {
        throw new Error(data.error || "Failed to process chat message");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${errorMessage}. Please modify your request or try again.` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [chatMessages, slides, config, activeTemplate, setSlides, updateConfig, setIsGenerating]);

  const resetChat = useCallback(() => {
    setChatMessages([
      {
        role: "assistant",
        content: "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!"
      }
    ]);
  }, []);

  // Download handlers
  const handleDownloadHtml = useCallback(() => {
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-carousel-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [previewHtml]);

  const handleDownloadPng = useCallback(() => {
    // Posts message to iframe; iframe runs dom-to-image-more per slide
    const iframe = document.querySelector<HTMLIFrameElement>("iframe[title='Carousel preview']");
    iframe?.contentWindow?.postMessage({ type: "DOWNLOAD_PNG" }, "*");
  }, []);

  const handleShare = useCallback(async () => {
    const textToShare = `${config.caption || ""}\n\n${config.hashtags || ""}`.trim();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SwipePosts - ${config.topic || "Post"}`,
          text: textToShare,
          url: window.location.origin,
        });
      } catch (err) {
        console.error("Sharing failed:", err);
      }
    } else {
      navigator.clipboard.writeText(textToShare);
      // We will show our standard SlideBuilder toast by sending a postMessage or triggering it, 
      // but since we want it quick, a simple alert is fine as a fallback or we can show a console log.
      alert("Natively sharing is not supported by your browser. Caption and hashtags copied to clipboard!");
    }
  }, [config.caption, config.hashtags, config.topic]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentPostId || undefined,
          topic: config.topic,
          caption: config.caption,
          hashtags: config.hashtags,
          slides,
          activeTemplate,
          platform: config.platform,
          chatHistory: chatMessages,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.post?.id) {
          setCurrentPostId(data.post.id);
          localStorage.setItem("swipeposts_draft_post_id", data.post.id);
          alert("Draft saved successfully!");
        }
      } else {
        throw new Error("Failed to save draft");
      }
    } catch (e) {
      alert("Error saving draft: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  }, [currentPostId, config, slides, activeTemplate, chatMessages, setCurrentPostId]);

  const handleLoadPost = useCallback((
    id: string,
    loadedSlides: any[],
    loadedConfig: any,
    loadedTemplate: string,
    loadedChatHistory?: any[]
  ) => {
    setCurrentPostId(id);
    localStorage.setItem("swipeposts_draft_post_id", id);
    setSlides(loadedSlides);
    setConfig((prev) => ({
      ...prev,
      ...loadedConfig,
    }));
    setActiveTemplate(loadedTemplate);
    if (loadedChatHistory && Array.isArray(loadedChatHistory)) {
      setChatMessages(loadedChatHistory);
    } else {
      setChatMessages([
        {
          role: "assistant",
          content: "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!"
        }
      ]);
    }
    setActiveTab("creator");
  }, [setCurrentPostId, setSlides, setConfig, setActiveTemplate, setChatMessages]);

  const handleNewPost = useCallback(() => {
    setCurrentPostId(null);
    localStorage.removeItem("swipeposts_draft_post_id");
    resetSlides();
    setConfig({
      author: "creator_handle",
      topic: "",
      goal: "educate",
      tone: "professional",
      caption: "",
      hashtags: "#creativity #inspiration #marketing",
      contentSource: "custom",
      bgImage: null,
      platform: "instagram",
    });
    setChatMessages([
      {
        role: "assistant",
        content: "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!"
      }
    ]);
    setActiveTemplate("clinical");
    setCustomTemplateHtml(null);
    setActiveTab("creator");
  }, [setCurrentPostId, resetSlides, setConfig, setActiveTemplate, setCustomTemplateHtml, setChatMessages]);

  if (!isLoaded || !isSignedIn) return null;

  const getPlatformBranding = (platform: "instagram" | "facebook" | "linkedin" | "whatsapp") => {
    const isDark = theme === "dark";
    switch (platform) {
      case "facebook":
        return {
          gradient: "from-blue-600 to-blue-800",
          shadow: "shadow-blue-500/25",
          text: "text-blue-500",
          label: "Facebook",
          bg: isDark ? "bg-blue-950/40" : "bg-blue-50",
          iconColor: isDark ? "text-blue-400" : "text-blue-600",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
            </svg>
          ),
        };
      case "linkedin":
        return {
          gradient: "from-sky-600 to-blue-800",
          shadow: "shadow-sky-500/25",
          text: "text-sky-600",
          label: "LinkedIn",
          bg: isDark ? "bg-sky-950/40" : "bg-sky-50",
          iconColor: isDark ? "text-sky-400" : "text-sky-600",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          ),
        };
      case "whatsapp":
        return {
          gradient: "from-green-500 to-emerald-600",
          shadow: "shadow-green-500/25",
          text: "text-green-500",
          label: "WhatsApp",
          bg: isDark ? "bg-emerald-950/40" : "bg-emerald-50",
          iconColor: isDark ? "text-emerald-400" : "text-emerald-600",
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.004 0C5.372 0 0 5.372 0 12.004c0 2.115.55 4.1 1.589 5.897L0 24l6.236-1.637a11.954 11.954 0 005.768 1.492h.005c6.627 0 12.003-5.378 12.003-12.005c0-3.21-1.25-6.23-3.518-8.498A11.916 11.916 0 0012.004 0zm0 1.95c2.68 0 5.2.1 7.29 2.19c2.09 2.09 2.19 4.61 2.19 7.29s-.1 5.2-2.19 7.29c-2.09 2.09-4.61 2.19-7.29 2.19c-1.69 0-3.35-.44-4.81-1.28l-.34-.2l-3.58.94.96-3.49-.22-.35A10.007 10.007 0 012.2 12.004c0-5.405 4.394-9.8 9.8-9.8c0-.2.004-.254.004-.254z" />
            </svg>
          ),
        };
      case "instagram":
      default:
        return {
          gradient: "from-yellow-500 via-red-500 via-pink-500 to-purple-600",
          shadow: "shadow-pink-500/25",
          text: "text-pink-500",
          label: "Instagram",
          bg: "bg-black",
          iconColor: "text-white",
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect width="18" height="18" x="3" y="3" rx="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
            </svg>
          ),
        };
    }
  };

  const brand = getPlatformBranding(config.platform || "instagram");

  const TABS: { id: Tab; label: string }[] = [
    { id: "gallery", label: "Gallery" },
    { id: "creator", label: "Creator" },
    { id: "saved", label: "Saved Drafts" },
    { id: "preview", label: "Preview" },
  ];
  return (
    <ErrorBoundary>
    <div className={`flex h-screen overflow-hidden font-sans flex-col md:flex-row ${theme} ${
      theme === "dark" ? "bg-black text-neutral-100" : "bg-neutral-50 text-neutral-800"
    }`}>
      <OnboardingModal theme={theme} />

      {/* Top Mobile Header */}
      <header className={`md:hidden px-4 py-3 border-b flex items-center justify-between flex-shrink-0 ${
        theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${brand.gradient} p-[1.5px] flex items-center justify-center flex-shrink-0 shadow-sm ${brand.shadow}`}>
            <div className={`w-full h-full rounded-[4.5px] ${brand.bg} flex items-center justify-center ${brand.iconColor}`}>
              {brand.icon}
            </div>
          </div>
          <span className={`text-sm font-bold tracking-wide ${
            theme === "dark" ? "text-white" : "text-neutral-900"
          }`}>SwipePosts</span>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-1.5 rounded-lg border text-sm flex items-center justify-center ${
            theme === "dark"
              ? "border-neutral-800 text-yellow-400 bg-neutral-900"
              : "border-neutral-200 text-purple-600 bg-neutral-100"
          }`}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2.293a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.707 5.707a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM14 15.707a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zm-4 1.293a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zm-4-2.293a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zm-2.707-5.707a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM6 4.293a1 1 0 000 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`w-56 flex-shrink-0 border-r flex flex-col hidden md:flex ${
        theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
      }`}>
        <div className={`px-5 py-5 border-b flex items-center justify-between ${
          theme === "dark" ? "border-neutral-800" : "border-neutral-200"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${brand.gradient} p-[2px] flex items-center justify-center flex-shrink-0 shadow-sm ${brand.shadow}`}>
              <div className={`w-full h-full rounded-[6px] ${brand.bg} flex items-center justify-center ${brand.iconColor}`}>
                {brand.icon}
              </div>
            </div>
            <div>
              <p className={`text-sm font-bold leading-none tracking-wide ${
                theme === "dark" ? "text-white" : "text-neutral-900"
              }`}>SwipePosts</p>
              <p className={`text-[10px] mt-0.5 font-mono ${
                theme === "dark" ? "text-neutral-500" : "text-neutral-400"
              }`}>Social Post Maker</p>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg transition-colors border text-sm flex items-center justify-center ${
              theme === "dark"
                ? "border-neutral-800 text-yellow-400 bg-neutral-900 hover:bg-neutral-800"
                : "border-neutral-200 text-purple-600 bg-neutral-100 hover:bg-neutral-200/50"
            }`}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2.293a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.707 5.707a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM14 15.707a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zm-4 1.293a1 1 0 011-1v-1a1 1 0 11-2 0v1a1 1 0 011 1zm-4-2.293a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zm-2.707-5.707a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM6 4.293a1 1 0 000 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 0zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {TABS.filter(t => t.id !== "preview").map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${
                  isActive
                    ? theme === "dark"
                      ? "bg-neutral-900 text-white font-bold border-l-4 border-pink-500 pl-2"
                      : "bg-neutral-100 text-neutral-950 font-bold border-l-4 border-pink-500 pl-2"
                    : theme === "dark"
                    ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50"
                    : "text-neutral-550 hover:text-neutral-800 hover:bg-neutral-100/50"
                }`}
              >
                <span className="flex-shrink-0">
                  {tab.id === "gallery" ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : tab.id === "saved" ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className={`px-3 py-4 border-t ${
          theme === "dark" ? "border-neutral-800 bg-neutral-950" : "border-neutral-200 bg-white"
        }`}>
          <div className="px-3 mb-3">
            <p className={`text-xs font-mono ${
              theme === "dark" ? "text-neutral-500" : "text-neutral-400"
            }`}>{username}</p>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              theme === "dark"
                ? "text-neutral-500 hover:text-red-400 hover:bg-red-950/20"
                : "text-neutral-400 hover:text-red-600 hover:bg-red-50"
            }`}
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className={`flex-1 flex overflow-hidden flex-col md:flex-row ${
        theme === "dark" ? "bg-black" : "bg-neutral-50"
      }`}>

        {/* Left panel — Gallery or Creator */}
        <div className={`${
          activeTab === "preview" ? "hidden md:flex" : "flex w-full md:w-96"
        } flex-shrink-0 md:border-r flex flex-col overflow-hidden ${
          theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
        }`}>
          {/* Platform Selector (Top of everything in Left Panel) */}
          <div className={`px-6 py-4 border-b flex flex-col gap-3.5 ${
            theme === "dark" ? "border-neutral-800" : "border-neutral-200"
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xs font-mono uppercase tracking-widest ${
                theme === "dark" ? "text-neutral-400" : "text-neutral-500"
              }`}>
                {activeTab === "gallery" ? "Template gallery" : activeTab === "saved" ? "Saved drafts" : "Post builder"}
              </h2>
            </div>
            {activeTab === "creator" && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {(["instagram", "linkedin", "facebook", "whatsapp"] as const).map((plat) => {
                  const isActive = config.platform === plat;
                  const platBranding = getPlatformBranding(plat);
                  return (
                    <button
                      key={plat}
                      onClick={() => updateConfig("platform", plat)}
                      className={`flex-1 min-w-[70px] py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all border flex items-center justify-center gap-1.5 ${
                        isActive
                          ? theme === "dark"
                            ? "bg-neutral-900 text-white border-neutral-800 shadow-sm"
                            : "bg-neutral-100 text-neutral-900 border-neutral-200 shadow-sm"
                          : theme === "dark"
                          ? "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-neutral-900/40"
                          : "bg-transparent text-neutral-500 border-transparent hover:text-neutral-800 hover:bg-neutral-100/40"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${platBranding.gradient}`} />
                      <span className="capitalize">{plat === "instagram" ? "Insta" : plat === "linkedin" ? "LinkedIn" : plat === "facebook" ? "FB" : "WA"}</span>
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
              />
            ) : activeTab === "saved" ? (
              <SavedPosts
                theme={theme}
                activePostId={currentPostId}
                onLoadPost={handleLoadPost}
                onNewPost={handleNewPost}
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
              />
            )}
          </div>
        </div>

        {/* Right panel — always-visible live preview */}
        <div className={`${
          activeTab === "preview" ? "flex w-full md:flex-1" : "hidden md:flex md:flex-1"
        } overflow-hidden px-4 md:px-6 py-4 md:py-5 flex flex-col ${
          theme === "dark" ? "bg-black" : "bg-neutral-50"
        }`}>
          <LivePreview
            theme={theme}
            previewHtml={previewHtml}
            onDownloadHtml={handleDownloadHtml}
            onDownloadPng={handleDownloadPng}
            onShare={handleShare}
            onSaveDraft={handleSaveDraft}
            isSaving={isSaving}
          />
        </div>

      </main>

      {/* Bottom Mobile Navigation */}
      <nav className={`md:hidden border-t flex justify-around items-center py-2.5 flex-shrink-0 ${
        theme === "dark" ? "bg-neutral-950 border-neutral-800" : "bg-white border-neutral-200"
      }`}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
                isActive
                  ? "text-pink-500 font-bold"
                  : theme === "dark"
                  ? "text-neutral-500 hover:text-neutral-300"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              {tab.id === "gallery" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : tab.id === "creator" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </ErrorBoundary>
  );
}
