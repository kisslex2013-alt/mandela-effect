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

---

**Usage Rule for AI:** When creating new pages or components, ALWAYS refer to this file to ensure visual consistency. Do not introduce new colors or rounded styles unless necessary.

