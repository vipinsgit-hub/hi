# HI — Private Two-Person Messaging Web Application

> A minimalist, production-quality, private real-time messaging application designed for dedicated communication between two authorized individuals. Built with React, TypeScript, Tailwind CSS, Vite, and Supabase.

---

## 1. Project Overview

**HI** is intentionally not a commercial social network, community platform, or multi-channel Slack clone. It is a strictly controlled, high-privacy messaging application designed for two people who need a fast, distraction-free, reliable direct channel with:

- **Obsidian Dark Aesthetic:** Grounded in `#090909`, muted charcoal panels, white typography, and restrained blue accents.
- **Strict Authorization:** Account registration does not automatically grant room access. Access is gatekept via PostgreSQL Row-Level Security (`RLS`) and room membership tables.
- **Real-Time Communication:** Full duplex messaging via Supabase Realtime and Presence.
- **Optimistic UI:** Messages render immediately (0ms feedback) with server reconciliation and duplicate prevention.
- **Installable PWA:** Works seamlessly across iOS, Android, and Desktop with offline application shell caching.
- **Security Guarantee:** Service worker strictly excludes private messages, auth tokens, and database requests from cache.

---

## 2. Technology Stack

### Frontend
- **React 18** with **TypeScript (Strict Mode)**
- **Vite 6** (Blazing fast bundling & HMR)
- **Tailwind CSS v3** (Custom design tokens & responsive utilities)
- **Lucide React** (Minimalist, accessible SVG iconography)
- **React Router v6** (Protected client-side routing & access guards)
- **date-fns** (Safe timestamp & date separator formatting)
- **Vitest** (Unit test suite)

### Backend Integration
- **Supabase JavaScript Client** (`@supabase/supabase-js`)
- **Supabase Authentication** (Secure JWT sessions, email verification, password reset, profile synchronization)
- **Supabase Edge Functions** (Deno-based serverless function `auth-login` for secure username-to-email resolution and session establishment)
- **Supabase PostgreSQL** (Relational schema, private username mapping table, foreign keys, triggers, indices)
- **Supabase Realtime** (`postgres_changes` subscriptions)
- **Supabase Presence** (Online/offline state, last seen, typing indicators)
- **Supabase Row Level Security (RLS)** (Strict table-level access rules)

### PWA & Service Worker
- **vite-plugin-pwa** & **Workbox**
- Standalone display mode, custom SVG/PNG icons, web app manifest
- Static asset caching; external APIs and Supabase endpoints configured as `NetworkOnly`

---

## 3. Project Structure

```text
hi/
├── .env.example                     # Environment variable template
├── .gitignore                       # Git ignore rules (secrets & build output)
├── eslint.config.js                 # Modern ESLint 9 configuration
├── index.html                       # Entry HTML with meta & mobile viewport tags
├── package.json                     # Scripts & dependencies
├── postcss.config.js                # PostCSS setup
├── tailwind.config.js               # Custom obsidian color palette & tokens
├── tsconfig.json                    # Strict TypeScript compiler options
├── tsconfig.node.json               # Node/bundler configuration
├── vite.config.ts                   # Vite configuration with PWA & chunk splitting
│
├── public/
│   ├── favicon.svg                  # Minimalist app favicon
│   ├── manifest.webmanifest         # PWA Web Application Manifest
│   └── icons/
│       └── icon.svg                 # Vector app icon (maskable & any)
│
├── supabase/
│   ├── config.toml                  # Supabase CLI project configuration
│   └── migrations/
│       ├── 20260212000000_initial_schema.sql  # Profiles, rooms, members, messages, triggers
│       └── 20260212000001_rls_policies.sql    # Security definers, strict RLS & Realtime pub
│
└── src/
    ├── assets/
    ├── components/
    │   ├── auth/
    │   │   ├── AuthLayout.tsx       # Auth container with logo and security assurances
    │   │   └── PasswordInput.tsx    # Password input with show/hide toggle
    │   ├── chat/
    │   │   ├── ChatHeader.tsx       # Peer status, presence, switch person & settings
    │   │   ├── ChatMessageArea.tsx  # Chronological message feed & auto-scroll
    │   │   ├── ChatMessageBubble.tsx# Sent/received bubbles, status, retry & edit/delete
    │   │   ├── ChatMessageComposer.tsx # Multiline auto-expanding composer (Enter to send)
    │   │   ├── DateSeparator.tsx    # "Today", "Yesterday", and date separators
    │   │   ├── EmptyConversation.tsx# Minimalist empty state with Quick "HI" button
    │   │   ├── SettingsModal.tsx    # Account overview, RLS status, PWA install, sign out
    │   │   └── TypingIndicator.tsx  # Animated typing dots
    │   ├── common/
    │   │   ├── Avatar.tsx           # Monogram avatar with online status dot
    │   │   ├── Button.tsx           # Obsidian buttons (primary, secondary, danger, etc.)
    │   │   ├── Input.tsx            # Styled dark input with label and error handling
    │   │   ├── Modal.tsx            # Accessible dialog with ESC listener and backdrop blur
    │   │   ├── StatusDot.tsx        # Pulsing online status indicator
    │   │   └── Toast.tsx            # Floating toast notification container
    │   └── layout/
    │       ├── AppLayout.tsx        # Responsive centered container & safe-area support
    │       └── DevBanner.tsx        # Non-intrusive Stage 1 preview mode indicator
    │
    ├── contexts/
    │   ├── AuthContext.tsx          # Auth state, session persistence, role checks
    │   └── ToastContext.tsx         # Global toast dispatch system
    │
    ├── features/
    │   ├── auth/
    │   │   ├── auth.service.ts      # Supabase Auth integration layer
    │   │   └── auth.types.ts        # Typed auth parameters, profiles & session interfaces
    │   └── chat/
    │       ├── chat.service.ts      # Supabase DB & Realtime messaging service
    │       ├── chat.types.ts        # Typed messages, rooms, members & delivery states
    │       └── chat.reconcile.test.ts # Unit tests for message deduplication & reconciliation
    │
    ├── hooks/
    │   ├── useAuth.ts               # Hook to access authentication and profile
    │   ├── useChatRoom.ts           # Hook for room metadata and peer resolution
    │   ├── useMessages.ts           # Optimistic sending, pagination & message management
    │   ├── usePresence.ts           # Realtime presence, last seen & typing broadcast
    │   ├── usePWA.ts                # PWA installation prompt and online detection
    │   ├── useRealtimeMessages.ts   # Realtime postgres_changes subscription
    │   └── useToast.ts              # Hook for toast notifications
    │
    ├── lib/
    │   ├── mock/
    │   │   ├── mockAuthService.ts   # Isolated preview authentication adapter
    │   │   ├── mockChatService.ts   # Isolated preview chat service with localStorage persistence
    │   │   └── mockData.ts          # Pre-configured test users (Alex & Jordan)
    │   └── supabase/
    │       ├── client.ts            # Supabase client instantiation & environment validation
    │       └── database.types.ts    # Comprehensive Database interface matching SQL schema
    │
    ├── pages/
    │   ├── Chat.tsx                 # Primary two-person real-time messaging interface
    │   ├── ForgotPassword.tsx       # Password recovery request screen
    │   ├── Login.tsx                # Clean username login with 1-click preview presets
    │   ├── NotFound.tsx             # 404 handler
    │   ├── Register.tsx             # Account registration
    │   └── ResetPassword.tsx        # Password update screen from email link
    │
    ├── styles/
    │   └── index.css                # Tailwind directives, custom scrollbars, safe areas
    │
    ├── utils/
    │   ├── cn.ts                    # Class name merging utility (clsx + tailwind-merge)
    │   ├── date.ts                  # Date formatting, separators & presence calculations
    │   ├── date.test.ts             # Unit tests for date logic
    │   ├── validation.ts            # Form and message validation rules
    │   └── validation.test.ts       # Unit tests for validation
    │
    ├── App.tsx                      # Root component with protected route guards
    ├── main.tsx                     # Entry point mounting to #root
    └── vite-env.d.ts                # Environment variable type declarations
```

---

## 4. Development Modes

### Stage 1: Development Preview Mode (Active by default)
When `.env` does not contain valid Supabase credentials, the application automatically runs in **Development Preview Mode**.
- Provides a mock adapter with two pre-configured authorized users:
  - **Alex Rivera** (`alex@hi.chat`)
  - **Jordan Vance** (`jordan@hi.chat`)
- Includes a 1-click **"Switch Person"** header button to test real-time conversation dynamics from both sides on a single device.
- Full optimistic UI, message editing, message deletion, retry logic, responsive views, and PWA installation can be inspected and tested immediately.
- Displays a dismissible top banner indicating preview mode.

### Stage 2: Live Supabase Mode
When `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are provided in `.env.local` (or `.env`), the mock adapter is disabled, and all requests go directly to your live Supabase project with PostgreSQL RLS and Realtime replication.

---

## 5. Local Setup & Commands

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Clone the repository and enter the directory
cd hi

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
The application will be running at `http://localhost:5173`.

### Running Tests
```bash
# Run unit test suite (Vitest)
npm run test
```

### Running Linter
```bash
# Check code quality and style
npm run lint
```

### Production Build
```bash
# Type check and build for production
npm run build

# Preview the production build locally
npm run preview
```

---

## 6. Supabase Integration (Stage 2 Instructions)

When you are ready to connect to your live Supabase cloud project:

### Step 1: Create Supabase Project
1. Log into [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public key** from `Settings` -> `API`.

### Step 2: Apply Database Migrations
Run the provided SQL migrations in your Supabase SQL Editor (or via Supabase CLI `supabase db push`):

1. **`supabase/migrations/20260212000000_initial_schema.sql`**
   - Creates `profiles` (with case-insensitive unique username), `usernames_private`, `chat_rooms`, `chat_members`, `messages`, and `invitations` tables.
   - Sets up indices and triggers for auto-updating timestamps and syncing auth signups to both public profiles and the private lookup table.
2. **`supabase/migrations/20260212000001_rls_policies.sql`**
   - Enables Row-Level Security on all tables.
   - Strictly protects `usernames_private` with zero client policies (only the Edge Function with service_role key can access it).
   - Enforces membership verification via security definer functions.
   - Activates Realtime replication on the `messages` table.

### Step 3: Deploy the `auth-login` Edge Function
Deploy the secure username-login Edge Function using the Supabase CLI:
```bash
supabase functions deploy auth-login --no-verify-jwt
```
The function automatically utilizes the native `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment secrets injected by the Supabase runtime.

### Step 4: Configure Email Verification
In the Supabase Dashboard:
1. Navigate to **Authentication** -> **Email Templates** -> **Confirm signup**.
2. Ensure **"Enable email confirmations"** is switched **ON**.
3. Set your Redirect URL to `http://localhost:5173/login` (or your production URL).

### Step 5: Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://qstlprcewjnmqexiqgjj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### Step 6: Automatic Zero-Friction Room Enrollment
The application requires zero manual room setup or invitations:
1. **Automatic Initialization**: When the first authorized user logs in, the single private chat room is automatically ensured and initialized.
2. **Direct Peer Admission**: When the second authorized user logs in, they are immediately and automatically admitted into the same private conversation.
3. **Strict 2-Person Guarantee**: Row-level database locking and capacity checks strictly cap conversation membership to 2 participants. Unauthorized third parties are denied entry.

---

## 7. PWA Installation & Offline Behavior

- **Mobile (iOS):** Open in Safari -> Tap Share -> "Add to Home Screen".
- **Mobile (Android):** Open in Chrome -> Tap "Install HI" prompt or menu.
- **Desktop (Chrome/Edge):** Click the Install button in the address bar or inside Chat Settings.
- **Cache Isolation:** The Service Worker precaches the UI bundle, fonts, and icons. Messages and authentication tokens are strictly kept out of worker caches.

---

## 8. Vercel Deployment

The application is deployed on **Vercel**:
- Production URL: `https://hichat-v1.vercel.app`
- Standard SPA rewrite configuration is supplied via `vercel.json`.
- Build command: `npm run build`
- Output directory: `dist`
- Required Environment Variables in Vercel:
  - `VITE_SUPABASE_URL=https://qstlprcewjnmqexiqgjj.supabase.co`
  - `VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key`

---

## 9. License

Private software. All rights reserved.

