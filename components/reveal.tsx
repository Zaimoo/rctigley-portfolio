"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades its children up the first time they scroll into view.
 *
 * The animation itself is pure CSS (see `.reveal` in globals.css); this only
 * flips a data attribute. The observer disconnects after firing, so scrolling
 * back up doesn't replay it.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Stagger, in ms. Useful for revealing a list one item at a time. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;

    // Server HTML is visible. Only animate content below the viewport once
    // JavaScript is ready; never hide content already being read.
    if (node.getBoundingClientRect().top < window.innerHeight) return;
    node.dataset.visible = "false";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.visible = "true";
        observer.disconnect();
      },
      // Fire slightly before the element reaches the bottom edge, so the
      // motion reads as "arriving" rather than "catching up".
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      delete node.dataset.visible;
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
