"use client";

import { useCallback, useState } from "react";
import { Slide, PostConfig } from "@/hooks/useSlides";
import { ChatMessage } from "@/types/chat";

export type ToastVariant = "success" | "error" | "info";

interface UsePostActionsParams {
  currentPostId: string | null;
  slides: Slide[];
  config: PostConfig;
  activeTemplate: string;
  chatMessages: ChatMessage[];
  previewHtml: string;
  setCurrentPostId: (id: string | null) => void;
  setSlides: (s: Slide[]) => void;
  setConfig: (updater: (prev: PostConfig) => PostConfig) => void;
  setActiveTemplate: (t: string) => void;
  setCustomTemplateHtml: (html: string | null) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  resetSlides: () => void;
}

const INITIAL_ASSISTANT_MSG: ChatMessage = {
  role: "assistant",
  content:
    "Hey! What would you like to create today? Describe your topic, goal, and tone, and I'll generate the slides. You can also refine them with me at any time!",
};

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

export function usePostActions({
  currentPostId,
  slides,
  config,
  activeTemplate,
  chatMessages,
  previewHtml,
  setCurrentPostId,
  setSlides,
  setConfig,
  setActiveTemplate,
  setCustomTemplateHtml,
  setChatMessages,
  resetSlides,
}: UsePostActionsParams) {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    resolve: (ok: boolean) => void;
  } | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    setToast({ message, variant });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  // ─── Download HTML ────────────────────────────────────────────────────────
  const handleDownloadHtml = useCallback(() => {
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `social-carousel-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [previewHtml]);

  // ─── Download PNG ─────────────────────────────────────────────────────────
  const handleDownloadPng = useCallback(() => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>("iframe");
    let target: HTMLIFrameElement | null = null;
    iframes.forEach((f) => {
      if (f.title === "Carousel preview") target = f;
    });
    if (!target) {
      // fallback: try any visible iframe
      target = iframes[0] ?? null;
    }
    if (target) {
      (target as HTMLIFrameElement).contentWindow?.postMessage({ type: "DOWNLOAD_PNG" }, "*");
    }
  }, []);

  // ─── Share ────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const textToShare = `${config.caption || ""}\n\n${config.hashtags || ""}`.trim();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SwipePosts - ${config.topic || "Post"}`,
          text: textToShare,
          url: window.location.origin,
        });
      } catch {
        // User cancelled share — ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        showToast("Caption and hashtags copied to clipboard!", "success");
      } catch {
        showToast("Could not copy to clipboard.", "error");
      }
    }
  }, [config.caption, config.hashtags, config.topic, showToast]);

  // ─── Save Draft ───────────────────────────────────────────────────────────
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
          showToast("Draft saved!", "success");
        }
      } else {
        throw new Error("Failed to save draft");
      }
    } catch (e) {
      showToast(
        "Error saving draft: " + (e instanceof Error ? e.message : "Unknown error"),
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    currentPostId,
    config,
    slides,
    activeTemplate,
    chatMessages,
    setCurrentPostId,
    showToast,
  ]);

  // ─── Load Post ────────────────────────────────────────────────────────────
  const handleLoadPost = useCallback(
    (
      id: string,
      loadedSlides: Slide[],
      loadedConfig: Partial<PostConfig>,
      loadedTemplate: string,
      loadedChatHistory?: ChatMessage[]
    ) => {
      setCurrentPostId(id);
      localStorage.setItem("swipeposts_draft_post_id", id);
      setSlides(loadedSlides);
      setConfig((prev) => ({ ...prev, ...loadedConfig }));
      setActiveTemplate(loadedTemplate);
      setChatMessages(
        loadedChatHistory?.length ? loadedChatHistory : [INITIAL_ASSISTANT_MSG]
      );
    },
    [setCurrentPostId, setSlides, setConfig, setActiveTemplate, setChatMessages]
  );

  // ─── New Post ─────────────────────────────────────────────────────────────
  const handleNewPost = useCallback(() => {
    setCurrentPostId(null);
    localStorage.removeItem("swipeposts_draft_post_id");
    resetSlides();
    setConfig(() => INITIAL_CONFIG);
    setChatMessages([INITIAL_ASSISTANT_MSG]);
    setActiveTemplate("clinical");
    setCustomTemplateHtml(null);
  }, [
    setCurrentPostId,
    resetSlides,
    setConfig,
    setActiveTemplate,
    setCustomTemplateHtml,
    setChatMessages,
  ]);

  return {
    isSaving,
    toast,
    confirmDelete,
    setConfirmDelete,
    clearToast,
    showToast,
    handleDownloadHtml,
    handleDownloadPng,
    handleShare,
    handleSaveDraft,
    handleLoadPost,
    handleNewPost,
  };
}
