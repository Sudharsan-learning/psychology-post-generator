import { useState, useEffect } from "react";

export default function OnboardingModal({ theme }: { theme: "dark" | "light" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem("swipeposts_onboarding_completed");
    if (!hasSeen) {
      // Delay showing slightly so it feels like an app loading
      const t = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const steps = [
    {
      title: "Welcome to SwipePosts! ✨",
      text: "The fastest way to generate stunning, high-converting social media carousels. Let's show you around.",
      button: "Next",
    },
    {
      title: "1. Chat to Create 💬",
      text: "Describe your post in the chat (e.g. '5 tips for better sleep'). Our AI will automatically write the copy and build a 4-slide carousel for you.",
      button: "Next",
    },
    {
      title: "2. Polish & Export 🎨",
      text: "Select a custom template from the gallery, tweak the text in the Slide Builder, and export directly to PNG when you're ready to post.",
      button: "Get Started",
    }
  ];

  if (!isOpen) return null;

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("swipeposts_onboarding_completed", "true");
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${
        theme === "dark" ? "bg-neutral-900 border border-neutral-800 text-white" : "bg-white border border-neutral-200 text-neutral-900"
      }`}>
        {/* Progress dots */}
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step 
                  ? "w-4 bg-gradient-to-r from-purple-500 to-pink-500" 
                  : i < step 
                    ? (theme === "dark" ? "w-1.5 bg-neutral-600" : "w-1.5 bg-neutral-300")
                    : (theme === "dark" ? "w-1.5 bg-neutral-800" : "w-1.5 bg-neutral-200")
              }`} 
            />
          ))}
        </div>

        <div className="p-8 pt-12 text-center">
          <h2 className="text-xl font-bold mb-3">{currentStep.title}</h2>
          <p className={`text-sm mb-8 leading-relaxed ${
            theme === "dark" ? "text-neutral-400" : "text-neutral-500"
          }`}>
            {currentStep.text}
          </p>
          <button
            onClick={handleNext}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
          >
            {currentStep.button}
          </button>
        </div>
      </div>
    </div>
  );
}
