# 🤖 BuddyAi - Private AI Companion Platform

> **Your 100% private, sovereign, and multi-platform AI companion hub.**  
> Plug in your own LLM API keys (**OpenRouter**, **OpenAI**, **Google Gemini**, **Ollama**, or any **Custom OpenAI-Compatible** provider), converse with bespoke personalities across Web & Telegram, and build emotional affinity with lifelong contextual memory.

---

## ✨ Features

- **🔐 100% Sovereign & Local-First**: Runs on a local SQLite database (`dev.db`). No external servers, no third-party telemetry, no cloud lock-in.
- **🔑 Bring-Your-Own-Model (BYO-Key)**: Store your API keys safely with AES-256-GCM encryption. Built-in presets for:
  - **OpenRouter** (Multi-model router)
  - **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o1-mini`, etc.)
  - **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-lite`)
  - **Ollama (Local)** with dual-stack localhost / 127.0.0.1 fallback
  - **Custom OpenAI-Compatible** endpoints (e.g. self-hosted vLLM, LM Studio, LiteLLM)
- **⚡ On-Demand Live Model Discovery**: Click the **⚡ Fetch Live Models** button to dynamically query and inspect live available models directly from your provider's API.
- **🛡️ Enterprise-Grade Login Rate Limiting & Lockout Management**:
  - Configurable sliding window duration (minutes) and max attempt thresholds with instant auto-saving.
  - Searchable user lockout picker with dropdown support to inspect and purge active lockouts for specific users or globally.
- **📱 Telegram Companion Bot**: Talk with your AI companions on-the-go via Telegram. Includes continuous background long-polling, 1-click account pairing, `/switch` inline keyboards, and live 2-way database synchronization.
- **🧠 Semantic Long-Term Memory (Local RAG)**: Companions remember facts, preferences, and details about your life using local BM25/TF-IDF semantic relevance ranking.
- **🎙️ Voice Immersion (STT & TTS)**:
  - **Speech-to-Text**: Dictate your thoughts directly into chat with live audio states.
  - **Text-to-Speech**: Audition different voice actors, configure pitch and speaking speed, and enable Auto-Speak to hear your companions respond aloud.
- **📈 Affinity & Relationship Progression**: Earn +5 XP per message as your bond deepens from *Acquaintance* to *Soulmate*.
- **🛍️ Companion Marketplace**: Browse, install, and share curated personalities (*Dr. Aris*, *Seraphina*, *Kaelen*, *Coach Rex*, *Thorin*), or export/import `.buddy.json` persona cards in one click.
- **🎨 Rich Aesthetics & Themes**: 5 curated themes (Midnight, Obsidian, Cyberpunk, Rose Gold, Pure White) with zero-flicker Anti-FOUC initialization and glassmorphic components.
- **🛡️ Data Vault & 1-Click Backups**: Export or restore your entire chat history, companions, and memories in portable JSON format.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with [SQLite](https://sqlite.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) with credentials provider & bcrypt hashing
- **Security**: Native Node.js `crypto` with AES-256-GCM encryption & in-memory sliding window rate limiting
- **Styling**: Vanilla CSS custom design system with Glassmorphism, CSS Variables, and CSS Shimmer loaders
- **Markdown & Code**: `react-markdown` + `remark-gfm` with 1-click code copying
- **Voice & Speech**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **Multi-Platform**: Telegram Bot API with long-polling daemon
- **Containerization**: Multi-stage Docker + Docker Compose

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-username/buddyai.git
cd buddyai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
cp .env.example .env
```
*(Optionally change `NEXTAUTH_SECRET` and `ENCRYPTION_SECRET` to random 32-character strings).*

### 4. Initialize database and seed default companions
```bash
npx prisma db push
node prisma/seed.js
```

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or configured port) in your browser.

**First-Run Admin Setup**:
- The first user who creates an account is automatically assigned as the **Super Admin** with full administrative rights.
- Super Admins can access the **User Management Panel** (`/admin/users`) to toggle public signups on/off, provision user/admin accounts, configure global login rate limits, search and reset user lockouts, force password resets, and delete accounts.

---

## 📱 Telegram Bot Setup (Optional)

1. Open [@BotFather](https://t.me/BotFather) on Telegram and send `/newbot`.
2. Copy your HTTP API bot token.
3. In BuddyAi: navigate to **Keys & Settings ➔ Telegram Bot Sync**.
4. Paste the bot token and click **Connect Telegram Bot**.
5. Start the background Telegram daemon in your terminal (or let Docker run it automatically):
   ```bash
   npm run telegram:bot
   ```
6. Click **Generate Pairing Code**, then send `/start <CODE>` to your bot in Telegram!

---

## 🐳 Docker Deployment (Recommended)

You can run the entire BuddyAi platform (web app, SQLite database, and Telegram bot runner) with a single command:

```bash
# Start container with automatic database initialization
docker compose up --build -d

# View container logs
docker compose logs -f

# Stop container
docker compose down
```

The SQLite database is automatically persisted to `./data/dev.db` on your host machine.

---

## 📁 Project Structure

```
BuddyAi/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/       # Companion home & active session feed
│   │   ├── characters/      # Companion roster & custom character builder
│   │   ├── chat/[id]/       # Real-time streaming chat room
│   │   ├── marketplace/     # Community persona hub & .buddy.json sharing
│   │   ├── settings/        # BYO-Keys, Live Model Fetching, Appearance, Telegram Sync, Data Vault
│   │   └── admin/users/     # User Management, Login Rate Limiting & Lockout Reset Panel
│   ├── api/                 # Next.js App Router API endpoints
│   ├── globals.css          # Core design system & theme tokens
│   └── layout.tsx           # Anti-FOUC theme injector & Session provider
├── components/              # Modular UI components (CustomDropdown, Markdown, Voice)
├── lib/                     # Crypto, Auth, LLM client, Semantic RAG & Rate Limiter
├── prisma/
│   ├── schema.prisma        # SQLite schema
│   └── seed.js              # Seed data for default companions
├── scripts/
│   └── telegram-daemon.mjs  # Continuous long-polling background runner
├── Dockerfile               # Production Docker container definition
├── docker-compose.yml       # Multi-service compose configuration
└── docker-entrypoint.sh     # Container initialization script
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
