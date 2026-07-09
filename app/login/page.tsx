import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | SwipePosts",
  description: "Sign in to your SwipePosts account to generate social media carousels with AI.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at center, #f0f4f8 0%, #fafafa 100%)' }}>
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <h1 className="sr-only">Sign in to SwipePosts</h1>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 via-red-500 via-pink-500 to-purple-600 p-[2.5px] flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/20">
          <div className="w-full h-full rounded-[12px] bg-black flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect width="18" height="18" x="3" y="3" rx="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01" />
            </svg>
          </div>
        </div>
        <SignIn routing="hash" fallbackRedirectUrl="/" />
      </div>
    </div>
  );
}
