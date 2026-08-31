# ♟️ Chess Tutor — AI Game Review & Coaching

An interactive, high-performance chess analysis web application inspired by **Chess.com Game Review**, powered by **Stockfish 18 (Multi-Core Web Worker Pool)** and **Gemini 2.5 AI Grandmaster Coaching**.

![Chess Tutor Banner](public/vite.svg)

---

## ✨ Features

- ⚡ **Multi-Core Stockfish 18 Engine**:
  - Automatically utilizes all available CPU cores via a **Web Worker Pool** (`navigator.hardwareConcurrency`).
  - Evaluates all game positions concurrently in parallel, completing a 50-ply game review in **under 1 second**.
- 📊 **Official CAPS2 Accuracy & Performance Rating**:
  - Computes precision scores with the official Chess.com CAPS2 expected-win formula:
    $$\text{MoveAccuracy}(\Delta W) = 103.1668 \times e^{-0.04354 \times \text{Loss}} - 3.1669$$
  - Move-by-move classifications: **Brilliant (!!)**, **Great (!)**, **Best (★)**, **Excellent (✓)**, **Good**, **Book (📖)**, **Inaccuracy (?!)**, **Mistake (?)**, **Miss (💔)**, **Blunder (??)**.
  - **Performance ELO Estimation** approximating player strength for the game (e.g. `~1750 ELO`).
- 🎓 **Guided "Key Moments" Walkthrough Mode**:
  - One-click guided walkthrough through the critical turning points of the match.
  - Interactive on-board puzzle solving: *"Can you find the winning move?"* with hints and confetti 🎉.
- 🧠 **Gemini 2.5 AI Grandmaster Coaching**:
  - Natural-language move explanations, tactical threat breakdowns (pins, forks, exposed king, sacrifices), and interactive tutor chat.
  - 4 Selectable Coach Personalities: **Grandmaster Mentor**, **Strict Master Boris**, **Coach Emma (Friendly)**, and **Coach Blitz (Witty)**.
- 💾 **Persistent Local Storage Game Cache**:
  - Automatically caches full Stockfish reviews in `localStorage` for **0ms instant reopening**.
  - Built-in cached game manager in the Import modal and Settings.
- 📥 **PGN & Online Platform Importer**:
  - Import games via PGN text, file upload, or fetch recent games directly from **Chess.com** or **Lichess** usernames.
- 📈 **Advantage Curve & Evaluation Bar**:
  - Real-time Advantage Graph (Recharts) with clickable blunder/brilliant nodes.
  - Dynamic vertical centipawn/mate evaluation bar.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or pnpm / yarn

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/<YOUR_USERNAME>/chess-tutor.git
cd chess-tutor

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Canvas Confetti
- **Chess Logic & Board**: `chess.js`, `react-chessboard`
- **Engine**: Stockfish 18 ASM / WebAssembly Web Worker Pool
- **AI Tutoring**: Google Gemini API (`@google/genai` / `gemini-2.5-flash`)
- **Build Tool**: Vite

---

## 🔑 Environment Configuration (Optional)

To enable live Gemini AI coach commentary and chat:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Enter your key in the in-app **Settings** (⚙️ top right) or create a `.env` file:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 📜 License

MIT License.
