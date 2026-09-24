"use client";

import { skills, type Skill } from "@/lib/content";

function SkillTile({ skill }: { skill: Skill }) {
  return (
    <li
      className="group flex shrink-0 items-center gap-3 rounded-2xl border border-hairline bg-surface px-5 py-4 transition-colors duration-300 hover:border-[color:var(--tile-accent)]"
      style={{ "--tile-accent": skill.color } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold transition-transform duration-300 group-hover:scale-110"
        style={{
          color: skill.color,
          // Tinted from the mark's own colour, so every tile is consistent
          // without hardcoding fourteen background values.
          backgroundColor: `color-mix(in oklab, ${skill.color} 16%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${skill.color} 32%, transparent)`,
        }}
      >
        {skill.mark}
      </span>
      <span className="whitespace-nowrap text-sm text-foreground/80">
        {skill.name}
      </span>
    </li>
  );
}

function MarqueeRow({
  items,
  duration,
  reverse = false,
}: {
  items: Skill[];
  duration: number;
  reverse?: boolean;
}) {
  return (
    <div className="marquee overflow-hidden py-2">
      <ul
        className="marquee-track flex gap-4"
        data-direction={reverse ? "reverse" : "forward"}
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        {/* Rendered twice. The animation translates exactly -50%, so the second
            copy is sitting where the first began and the seam is invisible. */}
        {items.map((skill) => (
          <SkillTile key={`a-${skill.name}`} skill={skill} />
        ))}
        {items.map((skill) => (
          <SkillTile key={`b-${skill.name}`} skill={skill} aria-hidden />
        ))}
      </ul>
    </div>
  );
}

export default function SkillsMarquee() {
  const half = Math.ceil(skills.length / 2);
  const topRow = skills.slice(0, half);
  const bottomRow = skills.slice(half);

  return (
    <div className="flex flex-col gap-4">
      {/* Two rows travelling opposite directions at slightly different speeds
          reads as motion rather than as a single sliding strip. */}
      <MarqueeRow items={topRow} duration={38} />
      <MarqueeRow items={bottomRow} duration={46} reverse />
    </div>
  );
}
