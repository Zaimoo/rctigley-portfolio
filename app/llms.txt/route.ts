import { about, contact, education, experience, projects, skills } from "@/lib/content";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  // Generated from the same content as the page to avoid stale AI summaries.
  const text = [
    `# ${site.name}`,
    `> ${site.description}`,
    "## Portfolio",
    ...[
      ["Home", ""],
      ["About", "#about"],
      ["Experience", "#experience"],
      ["Projects", "#projects"],
      ["Skills", "#skills"],
      ["Contact", "#contact"],
    ].map(([label, fragment]) => `- [${label}](${site.url}/${fragment})`),
    "## About",
    about.lead,
    ...about.body,
    ...about.facts.map((fact) => `- ${fact.label}: ${fact.value}`),
    "## Education",
    `${education.degree}, ${education.school} (${education.period}). ${education.location}.`,
    "## Experience",
    ...experience.map((role) =>
      `### ${role.title} — ${role.org}\n\n${role.period} | ${role.location}\n\n${role.points.map((point) => `- ${point}`).join("\n")}`,
    ),
    "## Projects",
    ...projects.map((project) =>
      `### ${project.title}\n\n${project.summary}\n\n- Year: ${project.year}\n- Role: ${project.role}\n- Technologies: ${project.stack.join(", ")}`,
    ),
    "## Skills",
    skills.map((skill) => skill.name).join(", "),
    "## Contact",
    `- [Email](mailto:${contact.email})`,
    ...contact.socials.map((social) => `- [${social.label}](${social.href})`),
  ].join("\n\n");

  return new Response(`${text}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
