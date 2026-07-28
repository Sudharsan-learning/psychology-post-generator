import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";

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
    { id: crypto.randomUUID(), eyebrow: "This week's read", headline: "", subtext: "" },
    { id: crypto.randomUUID(), eyebrow: "", headline: "", subtext: "" },
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

export const INITIAL_CONFIG: PostConfig = {
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

export const INITIAL_CHAT: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!",
  },
];

export function useSlides() {
  const [slides, setSlides] = useState<Slide[]>(createInitialSlides);
  const [config, setConfig] = useState<PostConfig>(INITIAL_CONFIG);
  const [activeTemplate, setActiveTemplate] = useState<string>("clinical");
  const [customTemplateHtml, setCustomTemplateHtml] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);

  // ─── Undo / Redo History Stack ─────────────────────────────────────────────
  const [past, setPast] = useState<Slide[][]>([]);
  const [future, setFuture] = useState<Slide[][]>([]);

  const pushToPast = useCallback((currentState: Slide[]) => {
    setPast((prev) => {
      const nextPast = [...prev, currentState];
      if (nextPast.length > 50) nextPast.shift(); // safety limit to 50 edits
      return nextPast;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);
      setSlides((currentSlides) => {
        setFuture((prevFuture) => [currentSlides, ...prevFuture]);
        return previous;
      });
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);
      setSlides((currentSlides) => {
        setPast((prevPast) => [...prevPast, currentSlides]);
        return next;
      });
      return newFuture;
    });
  }, []);

  // ─── Dirty tracking — only save when data actually changed ────────────────
  const lastSavedRef = useRef<string>("");

  // ─── Load from localStorage + database on mount ───────────────────────────
  useEffect(() => {
    async function loadData() {
      const savedSlides = localStorage.getItem("swipeposts_draft_slides");
      const savedConfig = localStorage.getItem("swipeposts_draft_config");
      const savedTemplate = localStorage.getItem("swipeposts_draft_template");
      const savedPostId = localStorage.getItem("swipeposts_draft_post_id");
      const savedChat = localStorage.getItem("swipeposts_draft_chat");

      // Apply local data first for instant load
      if (savedSlides) {
        try { setSlides(JSON.parse(savedSlides)); } catch { /* corrupted, ignore */ }
      }
      if (savedConfig) {
        try { setConfig(JSON.parse(savedConfig)); } catch { /* corrupted, ignore */ }
      }
      if (savedTemplate) setActiveTemplate(savedTemplate);
      if (savedPostId) setCurrentPostId(savedPostId);
      if (savedChat) {
        try { setChatMessages(JSON.parse(savedChat)); } catch { /* corrupted, ignore */ }
      }

      // Then fetch latest server draft (wins over local if available)
      try {
        const res = await fetch("/api/posts");
        if (res.ok) {
          const data: {
            posts: Array<{
              id: string;
              slides: Slide[];
              topic?: string;
              caption?: string;
              hashtags?: string;
              platform?: string;
              activeTemplate?: string;
              chatHistory?: ChatMessage[];
            }>;
          } = await res.json();

          if (data.posts && data.posts.length > 0) {
            const latest = data.posts[0];
            setCurrentPostId(latest.id);
            localStorage.setItem("swipeposts_draft_post_id", latest.id);
            if (Array.isArray(latest.slides)) setSlides(latest.slides);
            setConfig((prev) => ({
              ...prev,
              topic: latest.topic ?? "",
              caption: latest.caption ?? "",
              hashtags: latest.hashtags ?? "",
              contentSource: "custom",
              bgImage: null,
              platform: (latest.platform as PostConfig["platform"]) ?? "instagram",
            }));
            if (latest.activeTemplate) setActiveTemplate(latest.activeTemplate);
            if (Array.isArray(latest.chatHistory) && latest.chatHistory.length > 0) {
              setChatMessages(latest.chatHistory);
            }
          }
        }
      } catch {
        // Offline / unauthenticated — local draft is fine
      }

      setIsLoaded(true);
    }
    loadData();
  }, []);

  // ─── Auto-save: localStorage always, DB only when dirty ──────────────────
  useEffect(() => {
    if (!isLoaded) return;

    // Compute a fingerprint to detect real changes
    const fingerprint = JSON.stringify({ slides, config, activeTemplate, chatMessages });

    // 5s debounce
    const saveDraft = setTimeout(async () => {
      // 1. Always persist to localStorage
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

      // 2. Sync to DB only if data actually changed (dirty check)
      if (fingerprint === lastSavedRef.current) return;
      lastSavedRef.current = fingerprint;

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
          const data: { success: boolean; post?: { id: string } } = await res.json();
          if (data.success && data.post?.id && data.post.id !== currentPostId) {
            setCurrentPostId(data.post.id);
            localStorage.setItem("swipeposts_draft_post_id", data.post.id);
          }
        }
      } catch {
        // Silent — offline or rate-limited. LocalStorage has the data.
      }
    }, 5000); // 5s debounce (up from 2s)

    return () => clearTimeout(saveDraft);
    // Note: chatMessages deliberately excluded from deps to prevent save loops on AI response
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, config, activeTemplate, currentPostId, isLoaded]);

  const updateSlide = useCallback((id: string, field: keyof Slide, value: string) => {
    setSlides((prev) => {
      pushToPast(prev);
      return prev.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    });
  }, [pushToPast]);

  const addSlide = useCallback(() => {
    setSlides((prev) => {
      if (prev.length >= 10) return prev;
      pushToPast(prev);
      const last = prev[prev.length - 1];
      const newSlide: Slide = { id: crypto.randomUUID(), eyebrow: "", headline: "", subtext: "" };
      return last?.isCta ? [...prev.slice(0, -1), newSlide, last] : [...prev, newSlide];
    });
  }, [pushToPast]);

  const removeSlide = useCallback((id: string) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      pushToPast(prev);
      return prev.filter((s) => s.id !== id);
    });
  }, [pushToPast]);

  const moveSlide = useCallback((id: string, direction: "up" | "down") => {
    setSlides((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      pushToPast(prev);
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, [pushToPast]);

  const updateConfig = useCallback((field: keyof PostConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

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
    isLoaded,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
