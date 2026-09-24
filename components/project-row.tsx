"use client";

import Image from "next/image";
import type { PointerEvent } from "react";

import type { Project } from "@/lib/content";

/**
 * Accent wash and grid behind whatever fills the media slot. Drawn with
 * gradients, so it costs no asset either as a backdrop or on its own.
 */
function AccentBackdrop({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: `radial-gradient(120% 120% at 30% 20%, color-mix(in oklab, ${accent} 26%, transparent), transparent 70%)`,
      }}
    >
      <span
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(70% 70% at 50% 50%, black, transparent 100%)",
        }}
      />
    </div>
  );
}

/**
 * Fills the media slot when a project has no asset yet, so it reads as
 * intentional rather than as a missing image.
 */
function PlaceholderFrame({ project }: { project: Project }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <AccentBackdrop accent={project.accent} />
      <span
        aria-hidden="true"
        className="relative px-8 text-center font-mono text-xs uppercase tracking-[0.3em]"
        style={{ color: project.accent }}
      >
        {project.placeholder ?? project.title}
      </span>
    </div>
  );
}

/**
 * Phone screenshots are portrait, and cropping them into the landscape media
 * frame would throw most of each screen away - so they're fanned out as
 * handsets instead. Two shots sit shoulder to shoulder; three overlap with the
 * middle one in front. The fan opens a little further on hover, which is
 * driven from CSS (see `.phone-fan` in globals.css) off the properties set here.
 */
function PhoneFan({ project }: { project: Project }) {
  const shots = project.shots ?? [];
  // Signed distance from the middle of the fan: -1, 0, 1 for three shots,
  // -0.5, 0.5 for two. One set of transforms then covers both layouts.
  const middle = (shots.length - 1) / 2;

  return (
    <div className="absolute inset-0">
      <AccentBackdrop accent={project.accent} />

      <div
        className="absolute inset-0"
        // Fewer phones means fewer gaps to close, so they spread further apart.
        style={
          {
            "--spread": shots.length > 2 ? "66%" : "88%",
          } as React.CSSProperties
        }
      >
        {shots.map((shot, i) => {
          const offset = i - middle;

          return (
            <div
              key={shot.src}
              className="phone-fan-item absolute left-1/2 top-1/2 aspect-[9/19.5] h-[84%] overflow-hidden rounded-[clamp(0.6rem,2.4cqw,1.4rem)] border border-white/10 bg-black shadow-[0_24px_50px_-18px_rgba(0,0,0,0.65)] ring-1 ring-black/20"
              style={
                {
                  "--i": offset,
                  "--depth": Math.abs(offset),
                  // Whole numbers only, and the middle phone wins.
                  zIndex: 10 - Math.round(Math.abs(offset) * 10),
                } as React.CSSProperties
              }
            >
              <Image
                className="object-cover"
                src={shot.src}
                alt={`${project.title} - ${shot.label}`}
                fill
                sizes="(min-width: 1024px) 16vw, 28vw"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectRow({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  // Odd rows put the media on the left instead of the right.
  const mediaFirst = index % 2 === 1;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    // Written straight to the node: a pointermove at refresh rate must never
    // go through React state.
    event.currentTarget.style.setProperty(
      "--spot-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--spot-y",
      `${event.clientY - bounds.top}px`,
    );
  };

  return (
    <article
      style={{ "--card-accent": project.accent } as React.CSSProperties}
      className="group grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
    >
      {/* Media -------------------------------------------------------- */}
      <div
        onPointerMove={handlePointerMove}
        className={`spotlight relative isolate aspect-[4/3] overflow-hidden rounded-3xl border border-hairline bg-surface [container-type:inline-size] transition-colors duration-500 group-hover:border-[color:var(--card-accent)] ${
          mediaFirst ? "lg:order-1" : "lg:order-2"
        }`}
      >
        {project.media?.type === "video" ? (
          <video
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            src={project.media.src}
            // Autoplay only works muted, and playsInline stops iOS going
            // fullscreen the moment it starts.
            autoPlay
            muted
            loop
            playsInline
          />
        ) : project.media ? (
          <Image
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            src={project.media.src}
            alt={project.media.alt ?? project.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        ) : project.shots?.length ? (
          <PhoneFan project={project} />
        ) : (
          <PlaceholderFrame project={project} />
        )}
      </div>

      {/* Copy --------------------------------------------------------- */}
      <div
        className={`flex flex-col gap-5 ${
          mediaFirst ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest text-foreground/40">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden="true" className="h-px w-6 bg-hairline" />
          <span>{project.year}</span>
        </div>

        <h3 className="text-pretty text-3xl font-bold tracking-tight sm:text-4xl">
          {project.title}
        </h3>

        <p className="max-w-prose text-pretty text-base leading-relaxed text-foreground/60">
          {project.summary}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              color: project.accent,
              backgroundColor: `color-mix(in oklab, ${project.accent} 14%, transparent)`,
            }}
          >
            {project.role}
          </span>
          {project.stack.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-hairline px-3 py-1 text-xs text-foreground/50"
            >
              {tool}
            </span>
          ))}
        </div>

        {project.href ? (
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium transition-colors hover:text-accent"
          >
            View project
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
