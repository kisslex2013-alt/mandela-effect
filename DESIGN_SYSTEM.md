# 🎨 Mandela Effect Project — Design System & Brand Book

> **Core Philosophy:** "Glitch in the Matrix". Atmosphere of mystery, unstable reality, cyberpunk, and digital archives.

> **Theme:** Dark Mode Only. High contrast. Neon accents.

## 1. 🌑 Colors & Gradients (Tailwind)

### Backgrounds

- **Main Page BG:** `bg-dark` (#050505 or similar dark gray/black).

- **Grid Overlay:** `bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]`.

- **Ambient Glows:** Radial blobs `bg-purple-500/20` or `bg-blue-500/10` with `blur-[128px]`.

### Text Gradients (Brand Identity)

- **Primary Brand Gradient:** `bg-gradient-to-r from-cyan-400 to-purple-600` (Used in Main Title, Logo).

- **Secondary Gradient:** `from-primary to-secondary` (Tailwind config colors).

### Text Colors

- **Headings (White):** `text-white` or `text-light`.

- **Body/Description:** `text-light/60` (60% opacity).

- **Meta/Subtitles:** `text-light/40` (40% opacity).

## 2. 🔠 Typography

- **Font Family:** Sans-serif for main UI. Monospace (`font-mono`) for technical details, logs, and stats.

- **Titles:** `font-black`, `tracking-tighter` (Tight letter spacing).

- **Glitch Title Component:** Always use `<GlitchTitle text="..." />` for H1 on main pages.

## 3. 🧱 UI Components

### Cards (Glassmorphism)

- **Container:** `bg-darkCard` (or `bg-white/5`).

- **Border:** `border border-light/10`.

- **Backdrop:** `backdrop-blur-md` (if floating).

- **Hover State:** `hover:border-primary/30`, `hover:shadow-xl`, `hover:-translate-y-2`.

- **Transition:** `transition-all duration-300`.

### Buttons (Action)

- **Class:** `.btn-glitch` (Global CSS animation on hover).

- **Style:** Rounded corners (`rounded-xl`), bold text, icon on the left.

- **Primary Button:** `bg-primary text-white` or Gradients (e.g., `from-indigo-500/10 to-purple-500/10`).

- **Secondary Button:** `bg-white/5 hover:bg-white/10`.

### Inputs & Forms

- **Background:** `bg-dark`.

- **Border:** `border-light/10` -> Focus: `border-primary`.

- **Rounded:** `rounded-lg` or `rounded-xl`.

## 4. 🧩 Layout Patterns

### Header (Floating)

- **Position:** `fixed top-4`.

- **Style:** Pill-shape (`rounded-full`), Glassmorphism (`bg-black/60 backdrop-blur-xl`).

- **Content:** Logo left, Nav center, Actions right.

### Footer (System Console)

- **Style:** Technical / Terminal.

- **Font:** `font-mono text-xs`.

- **Features:** Running Ticker (Marquee) at the top. System Status indicators.

### Page Structure

- **Padding:** Standard pages need `pt-32` to clear the fixed header.

- **Container:** `max-w-7xl mx-auto px-4`.

## 5. ✨ Effects & Animations

### Glitch (CSS)

- **Text:** `clip-path` animations (glitch-1, glitch-2).

- **Image:** `skew` + `clip-path` on hover (Horror Glitch).

- **Class:** `.group` on parent, `.glitch-layer` on children.

### Framer Motion

- **Entry:** `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`.

- **Hover:** `whileHover={{ scale: 1.02 }}`.

### Images

- **Component:** `<ImageWithSkeleton />`.

- **Style:** "Blur-Fill" background (duplicate blurred image behind the main one) for non-16:9 images.

- **Features:**
  - Проксирование Google URL через `/api/image-proxy` для обхода CORS
  - Автоматический ретрай при ошибках
  - Плавная анимация появления
  - Поддержка Next.js Image и нативного `<img>`

### Badges & Status Indicators

#### Comment Badges
- **New Comments:** `bg-purple-500/90 text-white border-2 border-purple-400/70 shadow-lg shadow-purple-500/50 animate-pulse`
- **Regular Comments:** `bg-darkCard/95 text-light/90 border border-light/30`
- **With Media:** Иконка `LinkIcon` вместо `MessageSquare`

#### Trend Badges
- **Position:** Top-left corner of card
- **Style:** `bg-primary/20 text-primary px-2 py-1 rounded`
- **Examples:** "#1", "#2", "#3", "Новое"

#### Category Badges
- **Style:** `px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold uppercase tracking-[0.3em]`
- **Icons:** Category-specific icons (Film, Music, Tag, etc.)

### HUD Statistics (Home Page)

- **Container:** `bg-white/5 backdrop-blur-md border border-light/10 rounded-2xl shadow-2xl`
- **Grid:** `grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-light/10`
- **Item Style:** `p-4 flex flex-col items-center justify-center group hover:bg-white/5 transition-colors`
- **Value:** `text-xl font-mono font-bold text-white`
- **Label:** `text-[10px] text-light/40 uppercase font-bold tracking-wider`
- **Icons:** Color-coded (primary, blue-400, yellow-400, purple-400)

### Effect of the Day Card

- **Container:** `bg-gradient-to-r from-[#1b1030]/90 via-darkCard to-[#071c2a]/70 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-[0_0_80px_rgba(80,34,255,0.25)]`
- **Ambient Glow:** `bg-[radial-gradient(circle_at_top,#5b21b6,transparent_55%)] blur-3xl`
- **Badge:** `px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold uppercase tracking-[0.3em] text-white`
- **Stats Cards:** `bg-black/30 rounded-2xl border border-white/5 p-4`
- **Progress Bar:** `h-3 rounded-full bg-black/40 overflow-hidden flex border border-white/10`
  - Mandela: `bg-gradient-to-r from-purple-500 to-purple-300`
  - Reality: `bg-gradient-to-r from-green-400 to-green-300`

### Accordion (Archive Anomalies)

- **Container:** `bg-darkCard border rounded-xl overflow-hidden transition-colors`
- **Border Colors:**
  - Green: `border-green-500/20 hover:border-green-500/40`
  - Blue: `border-blue-500/20 hover:border-blue-500/40`
  - Amber: `border-amber-500/20 hover:border-amber-500/40`
  - Pink: `border-pink-500/20 hover:border-pink-500/40`
- **Button:** `w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors`
- **Content:** `p-4 pt-0 text-sm text-light/70 leading-relaxed border-t border-white/5 mx-4 mt-2 mb-4`
- **Animation:** Framer Motion `height: 0 → auto` with opacity

### Comment Types & Colors

#### WITNESS (Свидетели)
- **Background:** `bg-white/5`
- **Text:** `text-light/60`
- **Border:** `border-white/10`
- **Icon:** User icon

#### ARCHAEOLOGIST (Археологи)
- **Background:** `bg-blue-500/10`
- **Text:** `text-blue-300`
- **Border:** `border-blue-500/20`
- **Icon:** Link/Image icon

#### THEORIST (Теоретики)
- **Background:** `bg-purple-500/10`
- **Text:** `text-purple-300`
- **Border:** `border-purple-500/20`
- **Icon:** Brain icon

### Comment Interactions

- **Like Button (Active):** `text-green-400`
- **Dislike Button (Active):** `text-red-400`
- **Like Button (Inactive):** `text-light/40 hover:text-light/60`
- **Icon Size:** `w-3 h-3`

### Sound Toggle

- **Position:** `fixed bottom-24 right-6 z-50`
- **Container:** `p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10`
- **Active State:** `text-primary border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]`
- **Inactive State:** `text-white/50 hover:text-white hover:border-white/30`
- **Icon:** `w-6 h-6 transition-transform hover:scale-110`

### Loading States

#### Skeleton
- **Background:** `bg-darkCard animate-pulse`
- **Image Skeleton:** Blurred duplicate image behind main image
- **Text Skeleton:** `bg-white/5 rounded h-4`

#### Spinner
- **Component:** `<Loader2 className="w-4 h-4 animate-spin" />`
- **Color:** Inherits parent text color

### Status Colors

- **Success/Online:** `text-green-400`, `bg-green-500/10`, `border-green-500/20`
- **Error/Offline:** `text-red-400`, `bg-red-500/10`, `border-red-500/20`
- **Warning/Waiting:** `text-yellow-400`, `bg-yellow-500/10`, `border-yellow-500/20`
- **Info/Syncing:** `text-blue-400`, `bg-blue-500/10`, `border-blue-500/20`

### Progress Bars

- **Container:** `h-3 rounded-full bg-black/40 overflow-hidden flex border border-white/10`
- **Mandela Progress:** `bg-gradient-to-r from-purple-500 to-purple-300`
- **Reality Progress:** `bg-gradient-to-r from-green-400 to-green-300`
- **Width:** Dynamic based on percentage

### System Status (Footer)

- **Container:** `bg-white/5 rounded border border-white/5 hover:border-white/20 transition-colors`
- **Label:** `text-light/60`
- **Value:** `font-bold font-mono`
- **Glitch Effect:** Random text/color changes on hover (100ms interval)

## 6. 📱 Responsive Design (Mobile-First)

### Breakpoints

- **sm:** 640px (планшеты)
- **md:** 768px (небольшие десктопы)
- **lg:** 1024px (десктопы)
- **xl:** 1280px (большие экраны)

### Grid Patterns

- **Cards:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **HUD Stats:** `grid-cols-2 md:grid-cols-4`
- **Effect of Day:** `lg:grid-cols-[1.05fr_1fr]`

### Typography Scaling

- **Hero Title:** `text-5xl md:text-8xl`
- **Section Titles:** `text-2xl md:text-3xl`
- **Card Titles:** `text-lg md:text-xl`
- **Body Text:** `text-sm md:text-base`

### Spacing

- **Page Padding:** `pt-32` (для фиксированного header)
- **Section Gap:** `gap-6 md:gap-8`
- **Card Gap:** `gap-4 md:gap-6`

## 7. 🎭 Component-Specific Patterns

### GlitchTitle

- **Usage:** Always for main H1 titles
- **Structure:** First word white, rest with gradient
- **Animation:** Framer Motion `opacity: 0 → 1, scale: 0.9 → 1`
- **Classes:** `text-5xl md:text-7xl font-black text-white relative z-10 tracking-tighter leading-tight glitch-text`

### ImageWithSkeleton

- **Props:** `src`, `alt`, `width?`, `height?`, `fill?`, `className?`, `objectFit?`, `priority?`
- **Features:**
  - Automatic Google URL proxying
  - Retry logic on errors
  - Blur background during load
  - Smooth fade-in animation

### ArchiveAnomalies

- **Props:** `effectId`, `isOpen?`, `onToggle?`
- **Behavior:**
  - Loads comments on mount
  - Marks as read when opened
  - Dispatches `comments-read` event
  - Shows only APPROVED comments

### CommentForm

- **Text Area:** Auto-resizing, max 5000 chars
- **Media Input:** Optional URL field
- **Auto-detection:** Determines media type (image/video/audio)
- **Auto-type:** ARCHAEOLOGIST if media present, else WITNESS
- **Validation:** Client + server-side

---

**Usage Rule for AI:** When creating new pages or components, ALWAYS refer to this file to ensure visual consistency. Do not introduce new colors or rounded styles unless necessary.

