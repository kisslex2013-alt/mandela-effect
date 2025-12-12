'use client';

import dynamic from 'next/dynamic';

// Lazy load тяжелых компонентов для улучшения FCP
// Эти компоненты загружаются только на клиенте

export const UpsideDownLayer = dynamic(
  () => import("@/components/ui/UpsideDownLayer"),
  { ssr: false }
);

export const RealityTransition = dynamic(
  () => import("@/components/ui/RealityTransition"),
  { ssr: false }
);

export const SoundToggle = dynamic(
  () => import("@/components/ui/SoundToggle"),
  { ssr: false }
);

export const DevTools = dynamic(
  () => import("@/components/debug/DevTools"),
  { ssr: false }
);

