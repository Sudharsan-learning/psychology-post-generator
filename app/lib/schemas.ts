import { z } from "zod";

// ─── Shared ─────────────────────────────────────────────────────────────────

const PLATFORMS = ["instagram", "facebook", "linkedin", "whatsapp"] as const;
const TEMPLATES = ["clinical", "bold", "soft", "data", "honey", "mango", "developer", "terminal"] as const;

// ─── Slide schema ────────────────────────────────────────────────────────────

export const SlideSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  eyebrow: z.string().max(100).default(""),
  headline: z.string().max(300).default(""),
  subtext: z.string().max(1000).default(""),
  isCta: z.boolean().optional(),
  ctaText: z.string().max(300).optional(),
});

// ─── Chat message schema ─────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

// ─── POST /api/posts ─────────────────────────────────────────────────────────

export const SavePostSchema = z.object({
  id: z.cuid2().optional(),
  topic: z.string().max(200).optional().default(""),
  caption: z.string().max(2000).optional().default(""),
  hashtags: z.string().max(500).optional().default(""),
  slides: z.array(SlideSchema).min(1).max(10),
  activeTemplate: z.enum(TEMPLATES).optional().default("clinical"),
  platform: z.enum(PLATFORMS).optional().default("instagram"),
  chatHistory: z.array(ChatMessageSchema).max(100).optional().nullable(),
});

export type SavePostInput = z.infer<typeof SavePostSchema>;

// ─── POST /api/generate-post ─────────────────────────────────────────────────

export const GeneratePostSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(50),
  currentSlides: z.array(SlideSchema).max(10).optional(),
  caption: z.string().max(2000).optional().default(""),
  hashtags: z.string().max(500).optional().default(""),
  activeTemplate: z.enum(TEMPLATES).optional().default("clinical"),
  platform: z.enum(PLATFORMS).optional().default("instagram"),
});

export type GeneratePostInput = z.infer<typeof GeneratePostSchema>;
