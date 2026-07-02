import type { Variants, Transition } from "framer-motion";

/** Signature spring — organic "pop" for cards, gauge, receipt reveal. */
export const spring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
  mass: 0.9,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 170,
  damping: 22,
};

/** Container that staggers its children so the swarm assembles with rhythm. */
export const stagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.05 },
  },
};

export const riseIn: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: spring,
  },
  exit: { opacity: 0, y: -12, filter: "blur(4px)", transition: { duration: 0.25 } },
};

export const cardIn: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export const scaleReveal: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 24 },
  show: { opacity: 1, scale: 1, y: 0, transition: { ...spring, delay: 0.1 } },
};
