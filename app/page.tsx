"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState("");

  const [activeTab, setActiveTab] = useState<"creator" | "gallery" | "preview">("creator");
  
  // Form State
  const [contentSource, setContentSource] = useState<"ai" | "custom">("ai");
  const [content, setContent] = useState("");
  const [goal, setGoal] = useState("Educational");
  const [tone, setTone] = useState("Professional");
  const [authorName, setAuthorName] = useState("Jane Doe");
  const [pageName, setPageName] = useState("@jane.psych");

  // Custom Slides State (Dynamic up to 10)
  const [customSlides, setCustomSlides] = useState([
    { eyebrow: "", headline: "", subtext: "" },
    { eyebrow: "", headline: "", subtext: "" },
    { eyebrow: "", headline: "", subtext: "" },
    { eyebrow: "", headline: "", subtext: "", ctaLabel: "Next Step", ctaAction: "Save this post." },
  ]);
  const [customCaption, setCustomCaption] = useState("");
  const [customHashtags, setCustomHashtags] = useState("");

  // Template State
  const [activeTemplatePath, setActiveTemplatePath] = useState("/post-template.html");
  const [customTemplateFile, setCustomTemplateFile] = useState<File | null>(null);
  const [customTemplateHtml, setCustomTemplateHtml] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generation State
  const [loading, setLoading] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [error, setError] = useState("");
  const [post, setPost] = useState<any>(null);
  const [templateHtml, setTemplateHtml] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const router = useRouter();

  useEffect(() => {
    // Check local storage for login
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("auth");
      if (!auth) {
        router.push("/login");
      } else {
        setIsLoggedIn(true);
        setLoggedInUsername(localStorage.getItem("username") || "U");
      }
    }
  }, [router]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.action === 'png_ready') {
        setDownloadingPng(false);
        e.data.images.forEach((img: string, i: number) => {
          setTimeout(() => {
            const a = document.createElement("a");
            a.href = img;
            a.download = `carousel-slide-${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, i * 300);
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("auth");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomTemplateFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCustomTemplateHtml(evt.target.result as string);
          alert(`Successfully loaded custom template: ${file.name}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSlideChange = (index: number, field: string, value: string) => {
    const newSlides = [...customSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setCustomSlides(newSlides);
  };

  const addSlide = () => {
    if (customSlides.length < 10) {
      const newSlides = [...customSlides];
      const newSlide = { eyebrow: "", headline: "", subtext: "" };
      newSlides.splice(newSlides.length - 1, 0, newSlide);
      setCustomSlides(newSlides);
    }
  };

  const removeSlide = (indexToRemove: number) => {
    if (customSlides.length > 2) {
      const newSlides = customSlides.filter((_, idx) => idx !== indexToRemove);
      setCustomSlides(newSlides);
    }
  };

  async function generatePost() {
    if (contentSource === "ai" && !content.trim()) {
      setError("Please enter a psychology topic first!");
      return;
    }

    setLoading(true);
    setError("");
    setPost(null);
    setTemplateHtml("");

    try {
      let finalPostData: any = {};
      let normalizedSlides: any[] = [];

      if (contentSource === "ai") {
        const res = await axios.post("/api/generate-post", {
          content: content.trim(),
          goal,
          tone
        });
        finalPostData = res.data.post;
        normalizedSlides = [
          finalPostData.s1,
          finalPostData.s2,
          finalPostData.s3,
          finalPostData.s4
        ];
      } else {
        finalPostData = {
          caption: customCaption,
          hashtags: customHashtags.split(' ').filter(t => t.startsWith('#'))
        };
        normalizedSlides = customSlides;
      }

      setPost(finalPostData);

      // Resolve HTML source
      let html = "";
      if (customTemplateHtml) {
        html = customTemplateHtml;
      } else {
        const templateRes = await fetch(activeTemplatePath);
        html = await templateRes.text();
      }
      
      // Dynamic DOM injection for robust multi-slide templating
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const deck = doc.getElementById('carousel-deck');
      
      if (deck) {
        const originalSlides = Array.from(deck.querySelectorAll('.slide'));
        if (originalSlides.length > 0) {
          const coverTemplate = originalSlides[0].cloneNode(true) as HTMLElement;
          const contentTemplate = (originalSlides[1] || originalSlides[0]).cloneNode(true) as HTMLElement;
          const closingTemplate = (originalSlides[originalSlides.length - 1] || originalSlides[0]).cloneNode(true) as HTMLElement;
          
          deck.innerHTML = '';
          const total = normalizedSlides.length;

          normalizedSlides.forEach((slideData, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === total - 1;
            
            let slideEl = isFirst ? coverTemplate.cloneNode(true) as HTMLElement : 
                          isLast ? closingTemplate.cloneNode(true) as HTMLElement : 
                          contentTemplate.cloneNode(true) as HTMLElement;
            
            const numStr = String(idx + 1).padStart(2, '0');
            
            const pn = slideEl.querySelector('.pn');
            if (pn) pn.textContent = numStr;
            const ghostNum = slideEl.querySelector('.ghost-num');
            if (ghostNum) ghostNum.textContent = numStr;
            
            const eyebrowEl = slideEl.querySelector('.eyebrow');
            if (eyebrowEl) eyebrowEl.innerHTML = slideData.eyebrow || '';
            
            const headlineEl = slideEl.querySelector('.headline');
            if (headlineEl) headlineEl.innerHTML = slideData.headline || '';
            
            const subtextEl = slideEl.querySelector('.subtext');
            if (subtextEl) subtextEl.innerHTML = slideData.subtext || '';

            if (isLast) {
              const ctaLabelEl = slideEl.querySelector('.cta-box .label');
              if (ctaLabelEl) ctaLabelEl.innerHTML = slideData.ctaLabel || '';
              
              const ctaActionEl = slideEl.querySelector('.cta-box .action');
              if (ctaActionEl) ctaActionEl.innerHTML = slideData.ctaAction || '';
            }

            const footerSpans = slideEl.querySelectorAll('.footer-row span');
            if (footerSpans.length >= 1) {
              footerSpans[0].textContent = authorName; 
            }
            if (footerSpans.length >= 2) {
              footerSpans[1].textContent = `${numStr} / ${String(total).padStart(2, '0')}`;
            }

            const handleSpan = slideEl.querySelector('.handle span');
            if (handleSpan) handleSpan.textContent = pageName.replace('@', '');

            deck.appendChild(slideEl);
          });
        }
      }

      const scriptInjection = `
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
        <script>
          window.addEventListener('message', async (e) => {
            if (e.data.action === 'download_png') {
              const slides = document.querySelectorAll('.slide');
              const images = [];
              for (let i = 0; i < slides.length; i++) {
                const canvas = await html2canvas(slides[i], { scale: 1, backgroundColor: '#F6F2E9' });
                images.push(canvas.toDataURL('image/png'));
              }
              window.parent.postMessage({ action: 'png_ready', images }, '*');
            }
          });
        </script>
      </body>
      `;
      let finalHtml = doc.documentElement.outerHTML;
      finalHtml = finalHtml.replace('</body>', scriptInjection);

      setTemplateHtml(finalHtml);
      setActiveTab("preview");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to generate post. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const downloadHtml = () => {
    const blob = new Blob([templateHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instagram-carousel-preview.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerPngDownload = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setDownloadingPng(true);
      iframeRef.current.contentWindow.postMessage({ action: 'download_png' }, '*');
    }
  };

  const handleAutofill = () => {
    if (contentSource === "ai") {
      setContent("The psychology behind why we procrastinate even when we know it's bad for us.");
      setGoal("Educational");
      setTone("Empathetic");
    } else {
      setCustomSlides([
        { eyebrow: "Daily Note", headline: "Why we wait", subtext: "Understanding the delay" },
        { eyebrow: "Observation", headline: "Fear of failure", subtext: "We avoid the task to avoid the judgment." },
        { eyebrow: "Reframe", headline: "Action precedes motivation", subtext: "Start small." },
        { eyebrow: "Closing", headline: "One step today.", subtext: "", ctaLabel: "Next Step", ctaAction: "Try 5 mins now." }
      ]);
      setCustomCaption("Procrastination is often emotional regulation, not a time management issue.");
      setCustomHashtags("#psychology #procrastination");
    }
  };

  if (!isLoggedIn) {
    return null; // Let the useEffect redirect
  }

  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-900 font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-[320px] bg-white border-r border-neutral-200 flex flex-col h-full shadow-sm z-10 relative">
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </div>
            <h1 className="font-bold text-xl tracking-tight text-neutral-800">Post Maker</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800 mb-4 uppercase tracking-wider">Create Post</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Author Name</label>
                <input 
                  type="text" 
                  value={authorName} 
                  onChange={e => setAuthorName(e.target.value)}
                  className="w-full text-sm border border-neutral-200 rounded-md px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Page Name</label>
                <input 
                  type="text" 
                  value={pageName} 
                  onChange={e => setPageName(e.target.value)}
                  className="w-full text-sm border border-neutral-200 rounded-md px-3 py-2 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. @janepsychology"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">Content Source</label>
              <div className="bg-neutral-100 p-1 rounded-md flex text-[10px] font-medium">
                <button 
                  onClick={() => setContentSource('custom')}
                  className={`px-2 py-1 rounded-sm transition-colors ${contentSource === 'custom' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  Custom
                </button>
                <button 
                  onClick={() => setContentSource('ai')}
                  className={`px-2 py-1 rounded-sm transition-colors ${contentSource === 'ai' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                  AI Gen
                </button>
              </div>
            </div>

            {contentSource === "ai" ? (
              <textarea
                placeholder="What's on your mind? Type your topic or caption idea here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 text-sm border border-neutral-200 rounded-lg p-3 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all mt-2 placeholder:text-neutral-400"
              />
            ) : (
              <div className="text-xs text-neutral-500 mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                You are in Custom mode. Write your slide content manually in the Content Creator tab.
              </div>
            )}
            {error && <p className="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded-md border border-red-100">{error}</p>}
          </div>
        </div>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
          <button
            onClick={generatePost}
            disabled={loading || (contentSource === 'ai' && !content.trim())}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                Generate Content
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#fcfcfc]">
        {/* Top Navigation */}
        <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8 shrink-0">
          <nav className="flex gap-8">
            <button 
              onClick={() => setActiveTab("creator")}
              className={`text-sm font-medium h-16 border-b-2 transition-colors ${activeTab === 'creator' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
            >
              Content Creator
            </button>
            <button 
              onClick={() => setActiveTab("gallery")}
              className={`text-sm font-medium h-16 border-b-2 transition-colors ${activeTab === 'gallery' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
            >
              Template Gallery
            </button>
            <button 
              onClick={() => setActiveTab("preview")}
              className={`text-sm font-medium h-16 border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
            >
              Post Preview
            </button>
          </nav>
          
          <div className="flex items-center gap-4">
            <button className="text-neutral-400 hover:text-neutral-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 uppercase">
                {loggedInUsername.charAt(0)}
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold text-neutral-500 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* CONTENT CREATOR TAB */}
          {activeTab === 'creator' && (
            <div className="absolute inset-0 flex h-full">
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Creative Direction - Hidden in Custom Mode */}
                  {contentSource === "ai" && (
                    <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-neutral-800">Creative Direction</h3>
                        <button onClick={handleAutofill} className="text-blue-600 text-sm font-medium hover:underline">Autofill</button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-2">Primary Goal</label>
                          <select 
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full text-sm border border-neutral-200 rounded-md px-3 py-2.5 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                          >
                            <option>Educational</option>
                            <option>Inspirational</option>
                            <option>Promotional</option>
                            <option>Engagement</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-2">Tone</label>
                          <select 
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full text-sm border border-neutral-200 rounded-md px-3 py-2.5 bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                          >
                            <option>Professional</option>
                            <option>Casual</option>
                            <option>Empathetic</option>
                            <option>Provocative</option>
                          </select>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Content Block / Slide Builder */}
                  <section className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-800">{contentSource === 'ai' ? 'Content Block' : 'Slide Builder'}</h3>
                      {contentSource === 'custom' && (
                        <button onClick={handleAutofill} className="text-blue-600 text-sm font-medium hover:underline">Demo Fill</button>
                      )}
                    </div>
                    
                    {contentSource === "ai" ? (
                      <div className="flex-1 bg-neutral-50 rounded-lg border border-neutral-100 p-4 relative">
                        {post ? (
                          <div className="prose prose-sm text-neutral-700">
                            <p className="font-semibold mb-2">Caption:</p>
                            <p className="whitespace-pre-wrap">{post.caption}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {post.hashtags?.map((tag: string, i: number) => (
                                <span key={i} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-medium">{tag}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-neutral-400 text-sm italic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-4">
                            Your AI-generated content will appear here after clicking "Generate Content".
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Custom Slide Builder Mode */}
                        <div className="space-y-4">
                          {customSlides.map((slide, index) => (
                            <div key={index} className="p-4 bg-neutral-50 border border-neutral-100 rounded-lg shadow-sm relative">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-bold text-neutral-700">
                                  Slide {index + 1} {index === 0 ? '(Cover)' : index === customSlides.length - 1 ? '(Closing)' : ''}
                                </h4>
                                {customSlides.length > 2 && (
                                  <button onClick={() => removeSlide(index)} className="text-red-500 hover:text-red-700 p-1 bg-white rounded shadow-sm border border-red-100" title="Remove Slide">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Eyebrow</label>
                                  <input type="text" value={slide.eyebrow} onChange={(e) => handleSlideChange(index, 'eyebrow', e.target.value)} className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none" placeholder="e.g. Daily Note" />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Headline</label>
                                  <input type="text" value={slide.headline} onChange={(e) => handleSlideChange(index, 'headline', e.target.value)} className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none" placeholder="e.g. Why we wait" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Subtext</label>
                                <textarea value={slide.subtext} onChange={(e) => handleSlideChange(index, 'subtext', e.target.value)} className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 h-16 resize-none focus:border-blue-500 outline-none" placeholder="Write your paragraph..." />
                              </div>
                              {index === customSlides.length - 1 && (
                                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-neutral-200">
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">CTA Label</label>
                                    <input type="text" value={slide.ctaLabel} onChange={(e) => handleSlideChange(index, 'ctaLabel', e.target.value)} className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none" placeholder="e.g. Next Step" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">CTA Action</label>
                                    <input type="text" value={slide.ctaAction} onChange={(e) => handleSlideChange(index, 'ctaAction', e.target.value)} className="w-full text-xs border border-neutral-200 rounded px-2 py-1.5 focus:border-blue-500 outline-none" placeholder="e.g. Save this post." />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {customSlides.length < 10 && (
                          <button 
                            onClick={addSlide}
                            className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            + Add Another Slide (Max 10)
                          </button>
                        )}

                        <div className="p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                          <h4 className="text-sm font-bold text-neutral-700 mb-3">Post Caption Details</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Caption</label>
                              <textarea value={customCaption} onChange={(e) => setCustomCaption(e.target.value)} placeholder="Write your post caption..." className="w-full text-sm border border-neutral-200 rounded px-3 py-2 h-20 resize-none focus:border-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Hashtags (space separated)</label>
                              <input type="text" value={customHashtags} onChange={(e) => setCustomHashtags(e.target.value)} placeholder="#psychology #wellness" className="w-full text-sm border border-neutral-200 rounded px-3 py-2 focus:border-blue-500 outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="absolute inset-0 p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-neutral-800">Template Gallery</h2>
                  
                  <div className="relative flex items-center gap-4">
                    <input 
                      type="file" 
                      accept=".html" 
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm border border-neutral-200 bg-white px-4 py-2 rounded-lg font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      {customTemplateFile ? "Change Custom Template" : "Upload Custom Template"}
                    </button>
                    {customTemplateFile && (
                      <p className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 whitespace-nowrap font-medium">
                        ✓ Uploaded: {customTemplateFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-8">
                  {/* Gallery Sidebar */}
                  <div className="w-48 shrink-0 space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Categories</h4>
                      <ul className="space-y-1">
                        <li><button className="w-full text-left text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-md">All Templates</button></li>
                        <li><button className="w-full text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 px-3 py-2 rounded-md">Educational</button></li>
                        <li><button className="w-full text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 px-3 py-2 rounded-md">Quotes</button></li>
                        <li><button className="w-full text-left text-sm font-medium text-neutral-600 hover:bg-neutral-100 px-3 py-2 rounded-md">Product</button></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Style</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 text-xs border border-neutral-200 rounded-full bg-white shadow-sm font-medium cursor-pointer hover:bg-neutral-50">Minimal</span>
                        <span className="px-3 py-1 text-xs border border-neutral-200 rounded-full bg-white shadow-sm font-medium cursor-pointer hover:bg-neutral-50">Vibrant</span>
                        <span className="px-3 py-1 text-xs border border-neutral-200 rounded-full bg-white shadow-sm font-medium cursor-pointer hover:bg-neutral-50">Dark</span>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-6">
                    {[
                      { name: "Minimal Psychology", type: "Carousel", bg: "bg-orange-50", file: "/post-template.html" },
                      { name: "Therapy Quote", type: "Single Image", bg: "bg-blue-50", file: "/template-quote.html" },
                      { name: "Data Visual", type: "Infographic", bg: "bg-green-50", file: "/template-data.html" },
                      { name: "Modern Dark", type: "Carousel", bg: "bg-neutral-800 text-white", file: "/template-dark.html" }
                    ].map((tpl, i) => {
                      const isSelected = activeTemplatePath === tpl.file && !customTemplateFile;
                      return (
                        <div key={i} className="group cursor-pointer" onClick={() => {
                          setActiveTemplatePath(tpl.file);
                          setCustomTemplateFile(null);
                          setCustomTemplateHtml(null);
                          setActiveTab('creator');
                        }}>
                          <div className={`w-full aspect-[4/5] ${tpl.bg} rounded-xl border border-neutral-200 mb-3 relative overflow-hidden transition-all group-hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}`}>
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/5 flex items-center justify-center transition-opacity`}>
                              <button className="bg-white text-neutral-900 text-xs font-semibold px-4 py-2 rounded-full shadow-sm">{isSelected ? 'Selected' : 'Select'}</button>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Active</div>
                            )}
                          </div>
                          <h5 className={`font-semibold text-sm transition-colors ${isSelected ? 'text-blue-600' : 'text-neutral-800 group-hover:text-blue-600'}`}>{tpl.name}</h5>
                          <p className="text-xs text-neutral-500">{tpl.type}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* POST PREVIEW TAB */}
          {activeTab === 'preview' && (
            <div className="absolute inset-0 p-8 overflow-y-auto bg-neutral-100 flex flex-col items-center">
              <div className="w-full max-w-4xl flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-neutral-800">Preview & Publish</h2>
                 <div className="flex gap-3">
                   <button 
                     onClick={downloadHtml}
                     disabled={!templateHtml}
                     className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg shadow-sm hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
                   >
                     Download HTML
                   </button>
                   <button 
                     onClick={triggerPngDownload}
                     disabled={!templateHtml || downloadingPng}
                     className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                   >
                     {downloadingPng ? 'Processing PNGs...' : 'Download as PNGs'}
                   </button>
                   <button 
                     onClick={() => alert("This feature would connect to the Meta Graph API to share directly to your linked Instagram Business Account.")}
                     disabled={!templateHtml}
                     className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                   >
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                     Share to Instagram
                   </button>
                 </div>
              </div>

              {templateHtml ? (
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
                  <div className="w-full bg-[#111] rounded-xl overflow-hidden shadow-inner ring-1 ring-black/5 relative h-[600px]">
                    <iframe
                      ref={iframeRef}
                      srcDoc={templateHtml}
                      className="absolute top-0 left-0 border-none"
                      style={{ width: '300%', height: '300%', transform: 'scale(0.3333)', transformOrigin: '0 0' }}
                      title="Post Template Preview"
                    />
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-neutral-100">
                    <h3 className="font-semibold text-neutral-800 mb-3">Generated Caption</h3>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap">{post?.caption}</p>
                      <div className="mt-3 text-sm text-blue-600 font-medium">
                        {post?.hashtags?.join(" ")}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full max-w-md text-center mt-20">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-200 mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Preview Available</h3>
                  <p className="text-neutral-500 text-sm">Generate a post from the Content Creator tab to see the preview here.</p>
                  <button 
                    onClick={() => setActiveTab("creator")}
                    className="mt-6 px-4 py-2 bg-white border border-neutral-200 rounded-lg shadow-sm text-sm font-medium hover:bg-neutral-50 cursor-pointer"
                  >
                    Go to Creator
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
