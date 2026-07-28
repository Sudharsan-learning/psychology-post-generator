"use client";

import { useEffect, useState, useCallback } from "react";
import { Slide, PostConfig } from "@/hooks/useSlides";
import { ChatMessage } from "@/types/chat";
import { getPlatformColors } from "@/lib/platformColors";
import { ToastVariant, ConfirmModal } from "@/components/ui";
import { PlusIcon, TrashIcon, ArrowRightIcon } from "@/components/icons";

export interface PostItem {
  id: string;
  topic: string | null;
  caption: string | null;
  hashtags: string | null;
  slides: Slide[];
  activeTemplate: string;
  platform: "instagram" | "facebook" | "linkedin" | "whatsapp";
  chatHistory?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface SavedPostsProps {
  theme: "dark" | "light";
  onLoadPost: (
    id: string,
    slides: Slide[],
    config: Partial<PostConfig>,
    template: string,
    chatHistory?: ChatMessage[]
  ) => void;
  onNewPost: () => void;
  activePostId: string | null;
  platform: "instagram" | "facebook" | "linkedin" | "whatsapp";
  /** Bubbles toast notifications up to page level */
  onShowToast: (message: string, variant?: ToastVariant) => void;
}

export default function SavedPosts({
  theme,
  onLoadPost,
  onNewPost,
  activePostId,
  platform,
  onShowToast,
}: SavedPostsProps) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterTemplate, setFilterTemplate] = useState<string>("");

  const colors = getPlatformColors(platform);
  const isDark = theme === "dark";

  // Debounce search text changes
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch posts handler supporting cursor pagination
  const fetchPosts = useCallback(
    async (cursorVal?: string, append: boolean = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (cursorVal) queryParams.set("cursor", cursorVal);
        if (debouncedSearch) queryParams.set("search", debouncedSearch);
        if (filterPlatform) queryParams.set("platform", filterPlatform);
        if (filterTemplate) queryParams.set("template", filterTemplate);
        queryParams.set("limit", "10"); // Page size of 10

        const res = await fetch(`/api/posts?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch saved posts");
        const data: { posts: PostItem[]; nextCursor: string | null } = await res.json();

        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, filterPlatform, filterTemplate]
  );

  // Re-fetch when debounced search or filters update
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchPosts(nextCursor, true);
    }
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPendingDeleteId(id);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      const res = await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (id === activePostId) onNewPost();
      onShowToast("Post deleted.", "info");
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : "Failed to delete post", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* ── Confirm Delete Modal ──────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!pendingDeleteId}
        title="Delete saved post?"
        message="This action cannot be undone. The post will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        theme={theme}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDeleteId(null)}
      />

      <div className="flex items-center justify-between">
        <h3 className={`text-xs font-mono uppercase tracking-widest ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
          Saved Drafts
        </h3>
        <button
          onClick={onNewPost}
          className={`text-[10px] font-bold px-2.5 py-1.5 rounded ${colors.btnBg} text-white transition-all shadow-sm flex items-center gap-1`}
          aria-label="Create new post"
        >
          <PlusIcon />
          New Post
        </button>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-dashed border-neutral-850">
        <input
          type="text"
          placeholder="Search topic/caption..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`input text-xs px-2.5 py-1.5 w-full ${
            isDark ? "bg-neutral-900" : "bg-neutral-50"
          }`}
        />
        <div className="flex gap-1.5">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className={`input text-[10px] py-1 px-1.5 flex-1 min-w-[70px] ${
              isDark ? "bg-neutral-900" : "bg-neutral-50"
            }`}
          >
            <option value="">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className={`input text-[10px] py-1 px-1.5 flex-1 min-w-[70px] ${
              isDark ? "bg-neutral-900" : "bg-neutral-50"
            }`}
          >
            <option value="">All Templates</option>
            <option value="clinical">Clinical Notes</option>
            <option value="bold">Bold Statement</option>
            <option value="soft">Soft Pastel</option>
            <option value="data">Data Visual</option>
            <option value="honey">Honey Story</option>
            <option value="mango">Mango Story</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <div className={`w-5 h-5 border-2 ${colors.spinnerBorder} border-t-transparent rounded-full animate-spin`} aria-label="Loading saved posts" />
        </div>
      ) : posts.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed ${isDark ? "border-neutral-800 text-neutral-500" : "border-neutral-200 text-neutral-400"}`}>
          <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-xs font-semibold">No saved posts found</p>
          <p className="text-[10px] mt-1 opacity-70">Try adjusting your filters or create a new post.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto space-y-2.5 max-h-[calc(100vh-290px)] pr-1 flex flex-col">
          {posts.map((post) => {
            const isEditing = post.id === activePostId;
            const slideCount = Array.isArray(post.slides) ? post.slides.length : 0;
            return (
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  onLoadPost(post.id, post.slides, {
                    topic: post.topic || "",
                    caption: post.caption || "",
                    hashtags: post.hashtags || "",
                    platform: post.platform || "instagram",
                  }, post.activeTemplate, post.chatHistory)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onLoadPost(post.id, post.slides, {
                      topic: post.topic || "",
                      caption: post.caption || "",
                      hashtags: post.hashtags || "",
                      platform: post.platform || "instagram",
                    }, post.activeTemplate, post.chatHistory);
                  }
                }}
                className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex-shrink-0 ${
                  isEditing
                    ? colors.activeCard
                    : isDark
                    ? "bg-neutral-900 border-neutral-800/80 hover:bg-neutral-800 hover:border-neutral-700"
                    : "bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? "text-neutral-100" : "text-neutral-800"}`}>
                      {post.topic || "Untitled Post"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${isDark ? "bg-neutral-800 text-neutral-400 border border-neutral-700/50" : "bg-neutral-100 text-neutral-500 border border-neutral-200"}`}>
                        {post.platform || "instagram"}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${isDark ? "bg-neutral-800 text-neutral-400 border border-neutral-700/50" : "bg-neutral-100 text-neutral-500 border border-neutral-200"}`}>
                        {post.activeTemplate}
                      </span>
                      <span className={`text-[9px] font-semibold ${colors.textAccent}`}>
                        {slideCount} slide{slideCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => confirmDelete(e, post.id)}
                    className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Delete post: ${post.topic || "Untitled Post"}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className={`flex justify-between items-center mt-2.5 pt-2 border-t ${isDark ? "border-neutral-800/40" : "border-neutral-100"}`}>
                  <span className={`text-[9px] ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                    Updated {formatDate(post.updatedAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <span className={`text-[9px] font-bold ${colors.textAccent} flex items-center gap-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.bgAccent} animate-pulse`} />
                        Active
                      </span>
                    ) : (
                      <span className={`text-[10px] ${colors.textAccent} font-semibold group-hover:underline flex items-center gap-0.5`}>
                        Edit Draft <ArrowRightIcon />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Pagination Loader ────────────────────────────────────────── */}
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className={`w-full py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all ${
                isDark
                  ? "bg-neutral-900 border-neutral-850 hover:bg-neutral-800 text-neutral-300"
                  : "bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-600 shadow-sm"
              }`}
            >
              {isLoadingMore ? "Loading more..." : "Load More"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
