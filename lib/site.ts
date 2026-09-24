import { about, contact, education, projects, skills } from "@/lib/content";

export const site = {
  url: "https://reycezartigley.work",
  name: "Rey Cezar Tigley",
  title: "Rey Cezar Tigley — Full-Stack & Mobile Developer",
  description:
    "Full-stack and mobile developer in Oroquieta City, Philippines. Explore Rey Cezar Tigley's Flutter apps, web projects, and backend development work.",
};

export const profileJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: `${site.url}/`,
      jobTitle: "Full-stack and mobile application developer",
      description: about.lead,
      email: contact.email,
      sameAs: contact.socials.map((social) => social.href),
      knowsAbout: skills.map((skill) => skill.name),
      homeLocation: { "@type": "Place", name: about.facts[0].value },
      alumniOf: { "@type": "CollegeOrUniversity", name: education.school },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${site.url}/#profile`,
      url: `${site.url}/`,
      name: site.title,
      description: site.description,
      inLanguage: "en",
      isPartOf: { "@id": `${site.url}/#website` },
      mainEntity: { "@id": `${site.url}/#person` },
      hasPart: projects.map((project) => ({
        "@type": "CreativeWork",
        name: project.title,
        description: project.summary,
        keywords: project.stack.join(", "),
        contributor: { "@id": `${site.url}/#person` },
      })),
    },
  ],
};
