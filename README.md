# SocialPost AI (formerly Niraati / InstaPost)

SocialPost AI is a powerful, AI-driven social media carousel generator designed to help creators, marketers, and professionals rapidly design high-converting, beautiful multi-slide posts. 

By leveraging OpenRouter's meta-model APIs (`openrouter/free`), SocialPost AI transforms a simple topic into a structured, highly engaging carousel complete with headlines, subtexts, calls-to-action, captions, and hashtags.

## ✨ Key Features

### 🤖 AI-Powered Content Generation
- **Intelligent Copywriting**: Input a topic, goal (educate, inspire, entertain, promote), and tone. The AI generates a complete slide-by-slide narrative.
- **Dynamic Routing**: Uses OpenRouter's `openrouter/free` endpoint to automatically select the most reliable, high-quality, and 100% free conversational text generation model (like Gemma 2 or Llama 3) for zero-cost operation.
- **JSON Structured Output**: Ensures perfect, predictable slide mapping without manual copy-pasting.

### 🎨 Premium Template System
- **6 Built-in Themes**:
  - **Clinical Notes**: Clean, minimal margin strip with serif headlines (great for structured text).
  - **Bold Statement**: High contrast, large type (great for single ideas and quotes).
  - **Soft Pastel**: Warm tones and rounded feel (ideal for wellness/self-care).
  - **Data Visual**: Green tech/data aesthetic with monospace fonts and rounded cards.
  - **Honey Story**: Warm forest & honey tones with elegant Cormorant Garamond serif typography.
  - **Mango Story**: Bold mango gold & deep forest palette for vibrant product storytelling.
- **Custom HTML Upload**: Bring your own designs! Upload any `.html` template using token injection (`{{slide1_headline}}`, `{{author}}`, etc.) to map content instantly to your custom UI.

### 📱 Multi-Platform Branding
- **Dynamic Brand Shifting**: Select your target platform (Instagram, Facebook, LinkedIn) from the sidebar. The application's UI gradients and logos instantly morph to match the active brand aesthetic.
- *(Note: Facebook and LinkedIn specialized canvas generation formats are coming soon. The current carousel aspect ratio defaults to Instagram's 4:5 vertical format).*

### 🛠️ Real-Time Creator Studio
- **Live Preview Pane**: See your slides render in real-time as you tweak the copy, reorder slides, or switch templates.
- **Background Image Support**: Upload a custom background image that intelligently applies a dark overlay to maintain text readability across the entire carousel.
- **High-Fidelity Export**: Instantly download the entire carousel as ultra-high-resolution PNGs via the built-in html2canvas exporter, ready for immediate social media scheduling.

### 🌓 Responsive & Accessible
- **Desktop**: Split-pane productivity workspace (Gallery/Creator on left, Live Preview on right).
- **Mobile**: Native-app feel with a sleek bottom navigation tab bar, allowing you to seamlessly switch between the Gallery, Creator, and Preview views on smaller screens.
- **Dark/Light Mode**: Full theme support for a comfortable authoring experience.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and `pnpm` (or `npm`/`yarn`)
- An [OpenRouter API Key](https://openrouter.ai/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd psychology-post-generator
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure Environment Variables:
   Create a `.env.local` file in the root directory and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY="sk-or-v1-..."
   ```

4. Run the development server:
   ```bash
   pnpm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 How to Create Custom Templates

SocialPost AI supports completely custom HTML templates. If you have a `.html` file, you can upload it directly into the Template Gallery. 

The application will inject data into your HTML using the following handlebar-style tokens:

- `{{author}}` - The creator's handle/name.
- `{{slide1_eyebrow}}` - The eyebrow text for slide 1.
- `{{slide1_headline}}` - The headline text for slide 1.
- `{{slide1_subtext}}` - The body subtext for slide 1.
- `{{slideN_...}}` - Increment the number to target subsequent slides (e.g., `{{slide2_headline}}`).

Ensure your template uses CSS styling capable of rendering within the LivePreview iframe environment.

---

## 🛠️ Technology Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: Tailwind CSS
- **AI Integration**: [OpenRouter SDK](https://openrouter.ai/docs)
- **Exporting**: [dom-to-image-more](https://github.com/1904labs/dom-to-image-more) (high-res PNG)
- **Icons**: Custom SVG vectors + inline SVGs
