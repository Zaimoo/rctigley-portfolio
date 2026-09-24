"use client";

import { useEffect, useState } from "react";
import { contact } from "@/lib/content";

export default function ContactBlock() {
  const [copied, setCopied] = useState(false);

  // Reset the confirmation without leaving a timer behind on unmount.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
    } catch {
      // Clipboard access can be denied outright - the mailto link below still
      // works, so failing silently is better than an alert.
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <a
        href={`mailto:${contact.email}`}
        className="group block w-fit text-pretty text-3xl font-bold tracking-tight transition-colors duration-300 hover:text-accent sm:text-5xl lg:text-6xl"
      >
        {contact.email}
        <span
          aria-hidden="true"
          className="mt-2 block h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100"
        />
      </a>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          {/* aria-live so screen readers hear the change, not just sighted users. */}
          <span aria-live="polite">
            {copied ? "Copied to clipboard" : "Copy email"}
          </span>
        </button>

        {contact.socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full border border-hairline px-5 py-2.5 text-sm text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {social.label}
          </a>
        ))}
      </div>
    </div>
  );
}
