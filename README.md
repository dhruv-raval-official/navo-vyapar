# Navo Vyapar
### Premium Indian Multiplayer Board Game

An authentic, production-grade browser-based multiplayer property trading board game inspired by the traditional Indian **Navo Vyapar** (*Nava Vyapaar* / Indian Business).

Crafted with deep emerald greens, royal gold filigree accents, warm ivory title deed cards, authentic landmarks, real-time multiplayer synchronization via Socket.IO, and a server-authoritative financial game engine.

---

## 🌟 Key Features

### 1. Authentic Indian & Gujarat Identity
- **Iconic Landmarks**: Statue of Unity, Sabarmati, Dwarka, Somnath, Gir Somnath, Rann of Kutch, Ahmedabad, Surat, Modhera Sun Temple, Vadodara, and more.
- **Traditional Token Avatars**: Diya (🪔), Chakra (☸️), Lotus (🪷), Peacock (🦚), Gajraj Elephant (🐘), Patang Kite (🪁), Shankh (🐚), and Rangoli (🎨).
- **Thematic Indian Cards**: *Naseeb* (Chance) and *Samaj Seva* (Community Chest) featuring Diwali bonuses, Navratri contributions, Uttarayan gifts, and FD maturities.
- **Indian Game Currency**: Denominated in Rupees (₹) with traditional starting capital of ₹25,000 per player.

### 2. Real-Time Multiplayer
- **Instant Guest Play**: No email or mandatory login required. Enter a name, pick an avatar, and play.
- **Private Rooms**: Unique 6-character room codes (`ABCDEF`) and one-click shareable invitation links (`?room=CODE`).
- **Cross-Device Support**: Play seamlessly across desktop computers, tablets, Android, and iOS browsers.
- **Persistent Reconnection**: Browser `localStorage` reconnect tokens automatically restore active session, player inventory, and game state if the connection drops.
- **Live Table Chat & Reactions**: Expressive quick-reaction emojis (👍, ❤️, 😂, 😮, 😢, 🎉, 🎲, 🪔, 💸) and live table chat.

### 3. Server-Authoritative Game Engine
- All dice rolls, token movements, rents, mortgage math, building upgrades, and bankruptcies are computed and verified by the server.
- The client cannot tamper with balances, positions, or transactions.
- **Monopoly Double Rent**: Owning all properties in a color group doubles base rent.
- **Graduated Building**: Construct 1–4 houses evenly across a monopoly group before upgrading to a Grand Hotel.
- **Mortgage System**: Pledge property for 50% cash; unmortgage with 10% statutory interest.
- **Bilateral Trading**: Propose bilateral trades combining cash and property packages.
- **Jail Rules**: Escape via rolling doubles, paying ₹500 bail, or using a "Get Out of Jail Free" card.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Lightning-fast reactive single-page app |
| **Styling** | Tailwind CSS | Custom emerald, gold, ivory, and maroon palette |
| **Motion & FX**| Framer Motion | Smooth dice rolling, token movements, and modals |
| **Sound Engine**| Web Audio API synthesizer | Synthesized chimes, dice rolls, buy cheers & alerts |
| **Backend** | Node.js + Express | Single web service serving static build & API |
| **Networking**| Socket.IO (v4) | Low-latency bi-directional WebSocket connection |
| **State Store** | Zustand | Lightweight, high-performance client state |
| **Deployment**| Render Free Web Service | Automated zero-cost cloud deployment via `render.yaml` |

---

## 📋 Board Layout & Sequences

The 40-space board is arranged in a traditional square track:

* **Corner 0**: Start (GO) – Collect ₹2,000 salary
* **Spaces 1–9**: Heritage Towns (Mandvi, Bhuj), Western Railway, Coastal Cities (Porbandar, Junagadh, Dwarka)
* **Corner 10**: Jail / Just Visiting
* **Spaces 11–19**: Cultural Hubs (Rajkot, Jamnagar, Bhavnagar), Central Railway, Industrial Centers (Vadodara, Anand, Gandhinagar)
* **Corner 20**: Rest House / Free Parking
* **Spaces 21–29**: Royal Cities (Somnath, Gir Somnath, Statue of Unity), Northern Railway, Golden Triangle (Kutch Rann, Sabarmati, Patan)
* **Corner 30**: Go To Jail
* **Spaces 31–39**: Metro Cities (Rajpipla, Modhera, Ahmedabad), Southern Railway, Diamond Hubs (Surat, Mumbai)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` (bundled with Node.js)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/navo-vyapar.git
cd navo-vyapar

# Install server & client dependencies with one command
npm install
```

### 2. Run in Development Mode
To run both the Express backend and the Vite dev server concurrently with hot reload:
```bash
npm run dev
```
- Client runs at: `http://localhost:5173`
- Backend API runs at: `http://localhost:3001`

### 3. Production Build & Test Locally
```bash
# Build the client
npm run build

# Start the unified production server
npm start
```
Open `http://localhost:3001` in your browser.

---

## ☁️ Deploying to Render (Free Tier)

This repository is pre-configured for **Render's Free Web Service** using the included `render.yaml` Blueprint.

### Option A: One-Click Deploy via Blueprint
1. Push this repository to your **GitHub** account.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository. Render reads `render.yaml` automatically and configures:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **Apply**. Your game will be live in 2–3 minutes at `https://navo-vyapar-xxxx.onrender.com`.

### Option B: Manual Web Service Setup on Render
1. Click **New +** → **Web Service**.
2. Select your repository.
3. Configure the following fields:
   - **Name**: `navo-vyapar`
   - **Environment**: `Node`
   - **Region**: Closest to your players (e.g., Singapore or Frankfurt)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. In **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
5. Click **Deploy Web Service**.

> [!IMPORTANT]
> **Free Tier Sleep Behavior**:
> Render's free tier services spin down after 15 minutes of inactivity. When a player opens the game URL, the server wakes up within ~30–50 seconds.
> Because game rooms and states are kept safely in-memory without expensive external databases, active matches survive temporary network disconnections via the client's `localStorage` reconnect token as long as the server remains running.

---

## 🎯 Architecture

```
game/
├── package.json              # Root project configuration & scripts
├── render.yaml               # Zero-config Render Blueprint deployment
├── server/
│   ├── index.js              # Express app, Socket.IO server, and static asset host
│   ├── gameEngine.js         # Complete server-authoritative rule verification & state
│   ├── roomManager.js        # Multiplayer lobby, reconnect tokens, and cleanup
│   └── gameConfig.js         # Authentic 40-space board, cards, and economy rules
└── client/
    ├── package.json          # Frontend packages (React 18, Tailwind, Framer Motion)
    ├── vite.config.ts        # Vite build tool with development proxy
    ├── tailwind.config.js    # Custom Navo Vyapar theme (emerald, gold, ivory, maroon)
    └── src/
        ├── App.tsx           # Screen router, URL invitation handler, reconnection
        ├── types.ts          # Strongly typed data models
        ├── store/gameStore.ts# Zustand global client state & localStorage persistence
        ├── hooks/useSocket.ts# Socket.IO hook with auto-reconnection
        ├── pages/
        │   ├── LandingPage.tsx   # Hero branding, feature highlights
        │   ├── SetupPage.tsx     # Guest name & authentic token avatar selection
        │   ├── CreateRoomPage.tsx# Table hosting setup
        │   ├── JoinRoomPage.tsx  # Room code entry & invite link reader
        │   ├── LobbyPage.tsx     # Player readiness status, copyable link, host start
        │   ├── GamePage.tsx      # Central gameplay coordinator
        │   └── GameOverPage.tsx  # Victory celebrations, leaderboard & financial stats
        └── components/
            ├── GameBoard.tsx     # Centerpiece 40-space traditional square board
            ├── DiceRoller.tsx    # 3D Pip dice animation & roll management
            ├── ActionPanel.tsx   # Context-sensitive buttons (Buy, End Turn, Bail, Surrender)
            ├── PlayerPanel.tsx   # Player balance, property summary, and turn indicator
            ├── PropertyModal.tsx # Title Deed Card with complete rent & mortgage rules
            ├── TradeModal.tsx    # Bilateral property and money exchange system
            ├── ChatPanel.tsx     # Live table chat with quick reactions
            ├── RulesModal.tsx    # Interactive rulebook & guidance
            ├── TransactionHistory.tsx # Detailed activity log
            └── NotificationToast.tsx  # Animated action banners
```

---

## 📜 License & Acknowledgments

- **Inspiration**: Traditional Indian *Navo Vyapar* / *Vyapar* property trading board game.
- **License**: MIT License. Free for personal, educational, and community use.
- Made with 🪔 for Indian board game lovers everywhere.
