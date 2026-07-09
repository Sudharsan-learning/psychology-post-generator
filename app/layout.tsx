import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwipePosts — AI-Powered Social Media Carousel Generator",
  description: "Create stunning, high-converting social media carousels for Instagram, LinkedIn, Facebook, and WhatsApp using AI. Customize templates and export to PNG instantly.",
  keywords: [
    "AI carousel generator",
    "Instagram carousel maker",
    "LinkedIn PDF carousel generator",
    "social media carousel builder",
    "swipeable post creator",
    "AI social media post generator",
    "AI content generator for Instagram",
    "generate carousels with AI",
    "AI slide generator",
    "LinkedIn document post maker",
    "seamless Instagram carousel template",
    "SwipePosts"
  ],
  authors: [{ name: "SwipePosts Team" }],
  creator: "SwipePosts",
  publisher: "SwipePosts",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://swipeposts.vercel.app", // Change to actual production URL when deployed
    siteName: "SwipePosts",
    title: "SwipePosts — AI-Powered Social Media Carousel Generator",
    description: "Create stunning, high-converting social media carousels for Instagram, LinkedIn, Facebook, and WhatsApp using AI.",
    images: [
      {
        url: "/logo.svg",
        width: 800,
        height: 600,
        alt: "SwipePosts Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwipePosts — AI-Powered Social Media Carousel Generator",
    description: "Create stunning, high-converting social media carousels for Instagram, LinkedIn, Facebook, and WhatsApp using AI.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
