"use client";

import { useEffect, useState } from "react";
import { Slide, PostConfig } from "@/hooks/useSlides";

interface PostItem {
  id: string;
  topic: string | null;
  caption: string | null;
  hashtags: string | null;
  slides: any;
  activeTemplate: string;
  platform: string;
  chatHistory?: any;
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
    chatHistory?: any[]
  ) => void;
  onNewPost: () => void;
  activePostId: string | null;
}

export default function SavedPosts({
  theme,
  onLoadPost,
  onNewPost,
  activePostId,
}: SavedPostsProps) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) {
        throw new Error("Failed to fetch saved posts");
      }
      const data = await res.json();
      setPosts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this saved post?")) return;

    try {
      const res = await fetch(`/api/posts?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete post");
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
      
      // If we deleted the active post, call onNewPost to clear state
      if (id === activePostId) {
        onNewPost();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xs font-mono uppercase tracking-widest ${
          theme === "dark" ? "text-neutral-400" : "text-neutral-500"
        }`}>
          Saved Drafts
        </h3>
        <button
          onClick={onNewPost}
          className="text-[10px] font-bold px-2 py-1 rounded bg-pink-500 hover:bg-pink-600 text-white transition-all shadow-sm flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Post
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className={`flex-1 flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed ${
          theme === "dark" ? "border-neutral-800 text-neutral-500" : "border-neutral-200 text-neutral-400"
        }`}>
          <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-xs font-semibold">No saved posts found</p>
          <p className="text-[10px] mt-1 opacity-70">Your drafts are automatically saved as you build them.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto space-y-2.5 max-h-[calc(100vh-210px)] pr-1">
          {posts.map((post) => {
            const isEditing = post.id === activePostId;
            const slideCount = Array.isArray(post.slides) ? post.slides.length : 0;
            return (
              <div
                key={post.id}
                onClick={() =>
                  onLoadPost(
                    post.id,
                    post.slides,
                    {
                      topic: post.topic || "",
                      caption: post.caption || "",
                      hashtags: post.hashtags || "",
                      platform: (post.platform as any) || "instagram",
                    },
                    post.activeTemplate,
                    post.chatHistory
                  )
                }
                className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isEditing
                    ? "bg-pink-500/10 border-pink-500/30"
                    : theme === "dark"
                    ? "bg-neutral-900 border-neutral-800/80 hover:bg-neutral-800 hover:border-neutral-700"
                    : "bg-white border-neutral-250 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${
                      theme === "dark" ? "text-neutral-100" : "text-neutral-800"
                    }`}>
                      {post.topic || "Untitled Post"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                        {post.platform || "instagram"}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                        {post.activeTemplate}
                      </span>
                      <span className="text-[9px] font-semibold text-pink-500">
                        {slideCount} slide{slideCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(e, post.id)}
                    className="p-1 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete saved post"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-neutral-800/40">
                  <span className="text-[9px] text-neutral-500">
                    Updated {formatDate(post.updatedAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <span className="text-[9px] font-bold text-pink-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-pink-500 font-semibold group-hover:underline flex items-center gap-0.5">
                        Edit Draft
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
