import type { ReactNode } from "react";

import ContactBlock from "@/components/contact-block";
import HeaderScene from "@/components/header-scene";
import Reveal from "@/components/reveal";
import SkillsMarquee from "@/components/skills-marquee";
import ProjectRow from "@/components/project-row";
import { about, education, experience, projects } from "@/lib/content";
import { profileJsonLd } from "@/lib/site";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
      <span aria-hidden="true" className="h-px w-8 bg-accent" />
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section id="header" className="relative min-h-screen">
        <HeaderScene />

        {/* The name is drawn in WebGL, which search engines and screen readers
            cannot see - so the real heading stays in the DOM. */}
        <div className="sr-only">
          <h1>Rey Cezar Tigley</h1>
          <p>Shaping websites, apps, and the systems behind them</p>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 font-mono text-[0.625rem] uppercase tracking-[0.3em] text-foreground/30 md:block"
        >
          Scroll
        </span>
      </section>

      {/* About -------------------------------------------------------------- */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <div className="grid gap-12 lg:grid-cols-[18rem_1fr] lg:gap-20">
          {/* Sticks while the prose scrolls past it. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionLabel>About</SectionLabel>
              <h2 className="mt-6 text-pretty text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
                {about.lead}
              </h2>
            </Reveal>
          </div>

          <div className="flex flex-col gap-8">
            {about.body.map((paragraph, i) => (
              <Reveal key={i} delay={i * 90}>
                <p className="max-w-prose text-pretty text-base leading-relaxed text-foreground/60 sm:text-lg">
                  {paragraph}
                </p>
              </Reveal>
            ))}

            <Reveal delay={280}>
              <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
                {about.facts.map((fact) => (
                  <div key={fact.label} className="bg-background p-5">
                    <dt className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                      {fact.label}
                    </dt>
                    <dd className="mt-2 text-sm font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={340}>
              <div className="border-l-2 border-accent pl-5">
                <span className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                  Education
                </span>
                <p className="mt-3 text-sm font-medium">{education.degree}</p>
                <p className="mt-1 text-sm text-foreground/50">
                  {education.school}
                </p>
                <p className="mt-2 font-mono text-xs text-foreground/40">
                  {education.period} · {education.location}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Experience --------------------------------------------------------- */}
      <section
        id="experience"
        className="mx-auto max-w-6xl px-6 py-28 sm:py-36"
      >
        <Reveal>
          <SectionLabel>Experience</SectionLabel>
          <h2 className="mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Where I&apos;ve worked
          </h2>
        </Reveal>

        {/* Bottom border lives on the list, since each item only draws its
            top edge - otherwise the last role would sit on an open rule. */}
        <ol className="mt-14 flex flex-col border-b border-hairline">
          {experience.map((role, i) => (
            <Reveal as="li" key={role.org} delay={i * 90}>
              {/* A rule on the left with a node per role reads as a timeline
                  without needing any extra markup. */}
              <div className="grid gap-6 border-t border-hairline py-10 sm:grid-cols-[14rem_1fr] sm:gap-10">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase tracking-widest text-accent">
                    {role.period}
                  </span>
                  <span className="text-sm text-foreground/50">
                    {role.location}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {role.title}
                    <span className="text-foreground/40"> · {role.org}</span>
                  </h3>

                  <ul className="flex flex-col gap-2.5">
                    {role.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-3 text-pretty text-sm leading-relaxed text-foreground/60"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1 shrink-0 rounded-full bg-foreground/30"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Projects ----------------------------------------------------------- */}
      <section id="projects" className="mx-auto max-w-6xl px-6 py-28 sm:py-36">
        <Reveal>
          <SectionLabel>Projects</SectionLabel>
          <h2 className="mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Things I&apos;ve built and shipped
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col gap-24 sm:gap-32">
          {projects.map((project, i) => (
            <Reveal key={project.title}>
              <ProjectRow project={project} index={i} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Skills ------------------------------------------------------------- */}
      <section id="skills" className="py-28 sm:py-36">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionLabel>Skills</SectionLabel>
            <h2 className="mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
              Tools I reach for
            </h2>
          </Reveal>
        </div>

        {/* Full-bleed: the marquee runs edge to edge, not inside the container. */}
        <Reveal delay={120} className="mt-14">
          <SkillsMarquee />
        </Reveal>
      </section>

      {/* Contact ------------------------------------------------------------ */}
      <section id="contact" className="mx-auto max-w-6xl px-6 py-28 sm:py-40">
        <Reveal>
          <SectionLabel>Contact</SectionLabel>
          <h2 className="mt-6 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">
            Got something you want built? Let&apos;s talk about it.
          </h2>
        </Reveal>

        <Reveal delay={120} className="mt-14">
          <ContactBlock />
        </Reveal>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs text-foreground/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rey Cezar Tigley</p>
          <p className="font-mono uppercase tracking-widest">
            Built with Next.js &amp; Three.js
          </p>
        </div>
      </footer>
    </main>
  );
}
