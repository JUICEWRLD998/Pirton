import type { Variants, Transition } from "framer-motion";

/** Gentle, quick easing — no bouncy springs, no ambient motion. */
export const ease: Transition = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };
export const spring: Transition = { type: "spring", stiffness: 220, damping: 26, mass: 0.9 };

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: ease },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

/** Stagger container for lists/grids. */
export const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/** Scroll-reveal item — pairs with whileInView on a stagger container. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: ease },
};

/** Shared viewport config for scroll reveals. */
export const inView = { once: true, amount: 0.25 } as const;
