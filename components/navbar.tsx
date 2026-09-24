"use client";

import { useEffect, useState } from "react";

// Split either side of the centred call to action. "Contact" is deliberately
// absent - the button already points there.
const leftLinks = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
];

const rightLinks = [
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
];

/** How far down the page before the bar gains a background. */
const SCROLL_THRESHOLD = 24;

const linkClass =
  "text-sm text-foreground/70 transition-colors hover:text-foreground";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    // passive: the handler never calls preventDefault, so let the browser keep
    // scrolling without waiting on it.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Fixed rather than sticky so the header floats *over* the hero and the
    // 3D scene shows through it.
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-hairline bg-background/70 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav
        className="mx-auto flex min-h-16 max-w-6xl items-center justify-center gap-6 px-6 sm:gap-10"
        aria-label="Main navigation"
      >
        {/* Equal-basis flex on both sides is what keeps the button optically
            centred even though the link labels differ in width. */}
        <div className="hidden flex-1 items-center justify-end gap-6 sm:flex sm:gap-8">
          {leftLinks.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="shrink-0 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          Let&apos;s talk
        </a>

        <div className="hidden flex-1 items-center gap-6 sm:flex sm:gap-8">
          {rightLinks.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Scroll progress, driven entirely by CSS scroll-timeline - no listener,
          no state, no re-render. Simply absent where unsupported. */}
      <span
        aria-hidden="true"
        className="scroll-progress absolute inset-x-0 bottom-0 h-px bg-accent"
      />
    </header>
  );
}
