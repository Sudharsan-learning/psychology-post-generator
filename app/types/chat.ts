/** Shared ChatMessage type used across hooks, components, and API. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
