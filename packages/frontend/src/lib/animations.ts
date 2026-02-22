import type { Variants, Transition } from 'framer-motion';

// ─── Shared Framer Motion Variants ───────────────────────────────────────────
// All animations ≤ 300ms. Most are 150ms. Fast and responsive, not cinematic.

/** Default easeOut transition for most app animations */
export const defaultTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/** Page mount — subtle vertical shift + fade */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const pageTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/** Card stagger — used with index * 0.05 delay */
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function cardTransition(index: number): Transition {
  return {
    delay: index * 0.05,
    duration: 0.2,
    ease: 'easeOut',
  };
}

/** Modal mount — scale + fade with spring */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

export const modalTransition: Transition = {
  duration: 0.2,
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/** Overlay fade */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const overlayTransition: Transition = {
  duration: 0.15,
};

/** Tab content switch — fast crossfade */
export const tabContentVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const tabContentTransition: Transition = {
  duration: 0.1,
};

/** Sidebar collapse/expand */
export function sidebarTransition(): Transition {
  return {
    duration: 0.2,
    ease: 'easeInOut',
  };
}

/** Toast slide-in from right */
export const toastVariants: Variants = {
  initial: { opacity: 0, x: 80 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 80 },
};

export const toastTransition: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};
