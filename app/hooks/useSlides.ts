import { useState, useCallback, useEffect } from "react";

export type ContentSource = "ai" | "custom";

export interface Slide {
  id: string;
  eyebrow: string;
  headline: string;
  subtext: string;
  isCta?: boolean;
  ctaText?: string;
}

export interface PostConfig {
  author: string;
  topic: string;
  goal: string;
  tone: string;
  caption: string;
  hashtags: string;
  contentSource: ContentSource;
  bgImage: string | null;
  platform: "instagram" | "facebook" | "linkedin" | "whatsapp";
}

/** Factory — generates fresh IDs each call, safe for SSR. */
function createInitialSlides(): Slide[] {
  return [
    {
      id: crypto.randomUUID(),
      eyebrow: "This week's read",
      headline: "",
      subtext: "",
    },
    {
      id: crypto.randomUUID(),
      eyebrow: "",
      headline: "",
      subtext: "",
    },
    {
      id: crypto.randomUUID(),
      eyebrow: "Take this with you",
      headline: "",
      subtext: "",
      isCta: true,
      ctaText: "Save this post. Share it with someone who needs it.",
    },
  ];
}

const INITIAL_CONFIG: PostConfig = {
  author: "creator_handle",
  topic: "",
  goal: "educate",
  tone: "professional",
  caption: "",
  hashtags: "#creativity #inspiration #marketing",
  contentSource: "custom",
  bgImage: null,
  platform: "instagram",
};

export function useSlides() {
  // Use factory to avoid calling crypto.randomUUID() at module parse time (SSR safety)
  const [slides, setSlides] = useState<Slide[]>(createInitialSlides);
  const [config, setConfig] = useState<PostConfig>(INITIAL_CONFIG);
  const [activeTemplate, setActiveTemplate] = useState<string>("clinical");
  const [customTemplateHtml, setCustomTemplateHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!"
    }
  ]);

  // Load from local storage and database on mount
  useEffect(() => {
    async function loadData() {
      // 1. Save to local storage
      const savedSlides = localStorage.getItem("swipeposts_draft_slides");
      const savedConfig = localStorage.getItem("swipeposts_draft_config");
      const savedTemplate = localStorage.getItem("swipeposts_draft_template");
      const savedPostId = localStorage.getItem("swipeposts_draft_post_id");
      const savedChat = localStorage.getItem("swipeposts_draft_chat");
      
      if (savedSlides) {
        try { setSlides(JSON.parse(savedSlides)); } catch (_) {}
      }
      if (savedConfig) {
        try { setConfig(JSON.parse(savedConfig)); } catch (_) {}
      }
      if (savedTemplate) setActiveTemplate(savedTemplate);
      if (savedPostId) setCurrentPostId(savedPostId);
      if (savedChat) {
        try { setChatMessages(JSON.parse(savedChat)); } catch (_) {}
      }

      // 2. Fetch latest server draft if authenticated
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const posts = await res.json();
          if (posts && posts.length > 0) {
            const latest = posts[0];
            if (latest.id) {
              setCurrentPostId(latest.id);
              localStorage.setItem("swipeposts_draft_post_id", latest.id);
            }
            if (latest.slides) {
              setSlides(latest.slides);
            }
            setConfig({
              author: latest.author || "creator_handle",
              topic: latest.topic || "",
              goal: latest.goal || "educate",
              tone: latest.tone || "professional",
              caption: latest.caption || "",
              hashtags: latest.hashtags || "",
              contentSource: "custom",
              bgImage: null,
              platform: latest.platform || "instagram",
            });
            if (latest.activeTemplate) {
              setActiveTemplate(latest.activeTemplate);
            }
            if (latest.chatHistory && Array.isArray(latest.chatHistory)) {
              setChatMessages(latest.chatHistory);
            }
          }
        }
      } catch (err) {
        console.log("Could not load from DB, falling back to local draft:", err);
      }
      
      setIsLoaded(true);
    }
    loadData();
  }, []);

  // Save to local storage & sync to database on changes
  useEffect(() => {
    if (!isLoaded) return;
    
    const saveDraft = setTimeout(async () => {
      // 1. Save to local storage
      try {
        localStorage.setItem("swipeposts_draft_slides", JSON.stringify(slides));
        localStorage.setItem("swipeposts_draft_config", JSON.stringify(config));
        localStorage.setItem("swipeposts_draft_template", activeTemplate);
        localStorage.setItem("swipeposts_draft_chat", JSON.stringify(chatMessages));
        if (currentPostId) {
          localStorage.setItem("swipeposts_draft_post_id", currentPostId);
        } else {
          localStorage.removeItem("swipeposts_draft_post_id");
        }
      } catch (e) {
        console.warn("Failed to save draft to localStorage:", e);
      }

      // 2. Sync to DB
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
          if (data.success && data.post?.id && data.post.id !== currentPostId) {
            setCurrentPostId(data.post.id);
            localStorage.setItem("swipeposts_draft_post_id", data.post.id);
          }
        }
      } catch (e) {
        // Ignore silent DB failures (offline / unauthenticated)
      }
    }, 2000); // 2s debounce
    
    return () => clearTimeout(saveDraft);
  }, [slides, config, activeTemplate, currentPostId, chatMessages, isLoaded]);

  const updateSlide = useCallback((id: string, field: keyof Slide, value: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }, []);

  const addSlide = useCallback(() => {
    setSlides((prev) => {
      if (prev.length >= 10) return prev;
      const last = prev[prev.length - 1];
      const newSlide: Slide = {
        id: crypto.randomUUID(),
        eyebrow: "",
        headline: "",
        subtext: "",
      };
      // Insert before last slide if last is CTA, otherwise append
      if (last?.isCta) {
        return [...prev.slice(0, -1), newSlide, last];
      }
      return [...prev, newSlide];
    });
  }, []);

  const removeSlide = useCallback((id: string) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const moveSlide = useCallback((id: string, direction: "up" | "down") => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const updateConfig = useCallback(
    (field: keyof PostConfig, value: string) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetSlides = useCallback(() => {
    setSlides(createInitialSlides());
  }, []);

  return {
    slides,
    setSlides,
    config,
    activeTemplate,
    customTemplateHtml,
    isGenerating,
    setIsGenerating,
    setActiveTemplate,
    setCustomTemplateHtml,
    updateSlide,
    addSlide,
    removeSlide,
    moveSlide,
    updateConfig,
    resetSlides,
    currentPostId,
    setCurrentPostId,
    setConfig,
    chatMessages,
    setChatMessages,
  };
}
