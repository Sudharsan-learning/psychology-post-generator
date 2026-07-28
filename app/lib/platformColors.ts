/**
 * Shared platform color/branding tokens used by all components.
 * Single source of truth — eliminates the 4× duplicated getPlatformColors() functions.
 */

export type Platform = "instagram" | "facebook" | "linkedin" | "whatsapp";

/** Colors used in LivePreview toolbar and badges */
export interface PlatformUIColors {
  dotBg: string;
  saveDraftDark: string;
  saveDraftLight: string;
  pngBtn: string;
  badgeDot: string;
  badgeText: string;
  /** For SavedPosts spinner, badge, active card */
  btnBg: string;
  spinnerBorder: string;
  activeCard: string;
  textAccent: string;
  bgAccent: string;
}

/** Branding data for platform selectors, sidebar logo, mobile header */
export interface PlatformBranding {
  gradient: string;
  shadow: string;
  text: string;
  border: string;
  label: string;
  bg: string;
  iconColor: string;
}

export function getPlatformColors(platform: Platform | string): PlatformUIColors {
  switch (platform) {
    case "facebook":
    case "linkedin":
      return {
        dotBg: "bg-blue-500",
        saveDraftDark: "bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20 disabled:opacity-50",
        saveDraftLight: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 disabled:opacity-50",
        pngBtn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-blue-900/10 transition-all",
        badgeDot: "bg-blue-400",
        badgeText: "text-blue-400",
        btnBg: "bg-blue-600 hover:bg-blue-700",
        spinnerBorder: "border-blue-500",
        activeCard: "bg-blue-500/10 border-blue-500/30",
        textAccent: "text-blue-500",
        bgAccent: "bg-blue-500",
      };
    case "whatsapp":
      return {
        dotBg: "bg-green-500",
        saveDraftDark: "bg-green-600/10 text-green-400 border-green-500/20 hover:bg-green-600/20 disabled:opacity-50",
        saveDraftLight: "bg-green-50 text-green-600 border-green-100 hover:bg-green-100 disabled:opacity-50",
        pngBtn: "bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-green-900/10 transition-all",
        badgeDot: "bg-green-400",
        badgeText: "text-green-400",
        btnBg: "bg-green-600 hover:bg-green-700",
        spinnerBorder: "border-green-500",
        activeCard: "bg-green-500/10 border-green-500/30",
        textAccent: "text-green-500",
        bgAccent: "bg-green-500",
      };
    case "instagram":
    default:
      return {
        dotBg: "bg-pink-500",
        saveDraftDark: "bg-pink-600/10 text-pink-400 border-pink-500/20 hover:bg-pink-600/20 disabled:opacity-50",
        saveDraftLight: "bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100 disabled:opacity-50",
        pngBtn: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 disabled:opacity-40 text-white font-semibold shadow-md shadow-pink-900/10 transition-all",
        badgeDot: "bg-pink-400",
        badgeText: "text-pink-400",
        btnBg: "bg-pink-500 hover:bg-pink-600",
        spinnerBorder: "border-pink-500",
        activeCard: "bg-pink-500/10 border-pink-500/30",
        textAccent: "text-pink-500",
        bgAccent: "bg-pink-500",
      };
  }
}

export function getPlatformBranding(
  platform: Platform | string,
  theme: "dark" | "light"
): PlatformBranding {
  const isDark = theme === "dark";
  switch (platform) {
    case "facebook":
      return {
        gradient: "from-blue-600 to-blue-800",
        shadow: "shadow-blue-500/25",
        text: "text-blue-500",
        border: "border-blue-500",
        label: "Facebook",
        bg: isDark ? "bg-blue-950/40" : "bg-blue-50",
        iconColor: isDark ? "text-blue-400" : "text-blue-600",
      };
    case "linkedin":
      return {
        gradient: "from-sky-600 to-blue-800",
        shadow: "shadow-sky-500/25",
        text: "text-sky-600",
        border: "border-sky-600",
        label: "LinkedIn",
        bg: isDark ? "bg-sky-950/40" : "bg-sky-50",
        iconColor: isDark ? "text-sky-400" : "text-sky-600",
      };
    case "whatsapp":
      return {
        gradient: "from-green-500 to-emerald-600",
        shadow: "shadow-green-500/25",
        text: "text-green-500",
        border: "border-green-500",
        label: "WhatsApp",
        bg: isDark ? "bg-emerald-950/40" : "bg-emerald-50",
        iconColor: isDark ? "text-emerald-400" : "text-emerald-600",
      };
    case "instagram":
    default:
      return {
        gradient: "from-yellow-500 via-red-500 via-pink-500 to-purple-600",
        shadow: "shadow-pink-500/25",
        text: "text-pink-500",
        border: "border-pink-500",
        label: "Instagram",
        bg: "bg-black",
        iconColor: "text-white",
      };
  }
}
