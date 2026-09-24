/**
 * Page content lives here so the section components stay presentational.
 * Sourced from CV_Tigley_Professional.pdf.
 */

export type Media = {
  /** Path under /public, e.g. "/projects/red-carpet.mp4". */
  src: string;
  type: "image" | "video";
  /** Ignored for video, which is decorative and muted. */
  alt?: string;
};

export type Shot = {
  /** Path under /public, e.g. "/images/projects/red-carpet-planner.jpg". */
  src: string;
  /** Names the screen; becomes the alt text. */
  label: string;
};

export type Project = {
  title: string;
  summary: string;
  year: string;
  role: string;
  stack: string[];
  accent: string;
  href?: string;
  /** Leave undefined to render the generated placeholder frame. */
  media?: Media;
  /** Optional message shown when a project screenshot cannot be shared. */
  placeholder?: string;
  /**
   * Portrait app screenshots, fanned out as phones in the media frame. Two or
   * three read best - the middle one sits in front, so lead with the screen
   * that says most about the app. Ignored when `media` is set.
   */
  shots?: Shot[];
};

export const projects: Project[] = [
  {
    title: "Red Carpet",
    summary:
      "A Flutter mobile application built during my internship at Anura Innovations. I led the internship team as lead developer, handling task delegation, code reviews, and delivery milestones through to production-ready release.",
    year: "2026",
    role: "Lead developer",
    stack: ["Flutter", "Dart", "Git"],
    accent: "#8b7fd4",
    shots: [
      { src: "/images/projects/red-carpet-gigs.jpg", label: "Vendor gig feed" },
      {
        src: "/images/projects/red-carpet-planner.jpg",
        label: "Couple planner",
      },
      {
        src: "/images/projects/red-carpet-weddings.jpg",
        label: "Active weddings and tasks",
      },
    ],
  },
  {
    title: "TourEase",
    summary:
      "My thesis project: a tourism navigation app for Iligan City with a custom routing engine. Built on geospatial algorithms and shaped throughout by Human-Centered Design principles.",
    year: "2026",
    role: "Thesis",
    stack: ["Flutter", "Geospatial routing"],
    accent: "#6fb3a8",
    shots: [
      {
        src: "/images/projects/tourease-categories.jpg",
        label: "Destinations filtered by category",
      },
      {
        src: "/images/projects/tourease-map.jpg",
        label: "Mapped destinations",
      },
      { src: "/images/projects/tourease-discover.jpg", label: "Discover feed" },
    ],
  },
  {
    title: "TriGoRide",
    summary:
      "A ride-hailing app for tricycles with real-time booking and driver-passenger matching, backed by Firebase Auth, Firestore, and the Realtime Database for live synchronisation.",
    year: "2025",
    role: "Full-stack",
    stack: ["Flutter", "Firebase"],
    accent: "#e0a458",
    shots: [
      {
        src: "/images/projects/trigoride-booking.jpg",
        label: "Ride booking and fare breakdown",
      },
      {
        src: "/images/projects/trigoride-trip.jpg",
        label: "Accepted booking on the map",
      },
    ],
  },
  {
    title: "RevYou",
    summary:
      "A web-based study platform that auto-generates reviewers from content students supply. I built the Node.js backend services and the RESTful APIs integrating the OpenAI API.",
    year: "2025",
    role: "Backend",
    stack: ["Node.js", "OpenAI API", "REST"],
    accent: "#c98b9b",
    media: {
      src: "/images/projects/revyou-website.jpg",
      type: "image",
      alt: "RevYou landing page",
    },
  },
  {
    title: "Pedro's Roving Market",
    summary:
      "A point-of-sale and inventory management system with a companion mobile application. I implemented and integrated the core transaction and inventory features alongside the team.",
    year: "2026",
    role: "Team project",
    stack: ["Flutter", "POS/IMS"],
    accent: "#9aa4b8",
    shots: [
      {
        src: "/images/projects/pedros-roving-market-cart.png",
        label: "Order Cart for Customer App",
      },
      {
        src: "/images/projects/pedros-roving-market-checkout.png",
        label: "Checkout Information for Customer App",
      },
      {
        src: "/images/projects/pedros-roving-market-home.png",
        label: "Home Tab for Customer App",
      },
      {
        src: "/images/projects/pedros-roving-market-product.png",
        label: "Product Description for Customer App",
      },
    ],
  },
  {
    title: "Blue Raket",
    summary:
      "Built responsive interfaces and integrated the backend services behind the app's core functionality, delivered on a concurrent timeline with Pedro's Roving Market.",
    year: "2026",
    role: "Team project",
    stack: ["Flutter"],
    accent: "#8b7fd4",
    placeholder: "Screenshot not available due to proprietary reasons.",
  },
  {
    title: "IliganonGo",
    summary:
      "A mobile application mapping the jeepney routes of Iligan City to help commuters plan their trips. I implemented Firebase Authentication and Firestore CRUD operations, collaborating over Git.",
    year: "2024",
    role: "Mobile",
    stack: ["Flutter", "Firebase"],
    accent: "#6fb3a8",
    shots: [
      {
        src: "/images/projects/iliganonGo-home.png",
        label: "Home Tab for IliganonGo",
      },
      {
        src: "/images/projects/iliganonGo-maps.png",
        label: "Map Tab for IliganonGo",
      },
      {
        src: "/images/projects/iliganonGo-routes.png",
        label: "Routes for IliganonGo",
      },
    ],
  },
];

export type Skill = {
  name: string;
  /** Short monogram shown in the tile. */
  mark: string;
  color: string;
};

export const skills: Skill[] = [
  { name: "Flutter", mark: "Fl", color: "#47c5fb" },
  { name: "Dart", mark: "Dt", color: "#0175c2" },
  { name: "JavaScript", mark: "JS", color: "#f7df1e" },
  { name: "Node.js", mark: "No", color: "#5fa04e" },
  { name: "Firebase", mark: "Fb", color: "#ffca28" },
  { name: "PHP", mark: "Ph", color: "#777bb4" },
  { name: "WordPress", mark: "Wp", color: "#4a9fd0" },
  { name: "MySQL", mark: "My", color: "#4479a1" },
  { name: "PostgreSQL", mark: "Pg", color: "#4a90d9" },
  { name: "REST APIs", mark: "RE", color: "#6fb3a8" },
  { name: "OpenAI API", mark: "AI", color: "#10a37f" },
  { name: "Git", mark: "Gt", color: "#f05032" },
];

export type Role = {
  title: string;
  org: string;
  location: string;
  period: string;
  points: string[];
};

export const experience: Role[] = [
  {
    title: "Intern",
    org: "Anura Innovations",
    location: "Iligan City, Philippines",
    period: "Feb – May 2026",
    points: [
      "Led the internship team as lead developer for Red Carpet, a Flutter mobile application, overseeing task delegation, code reviews, and delivery milestones.",
      "Collaborated across concurrent projects, managing shifting priorities and dependencies.",
      "Applied Git for team collaboration, code integration, and release management.",
      "Handled debugging, testing, and performance optimisation for production-ready deliverables.",
    ],
  },
  {
    title: "WordPress Developer",
    org: "DreamTeam PH",
    location: "Philippines",
    period: "Sep – Dec 2024",
    points: [
      "Built and maintained WordPress sites with custom themes and plugin configurations.",
      "Customised page layouts and components to match client branding requirements.",
      "Optimised site performance, responsiveness, and cross-browser compatibility.",
      "Coordinated content updates, deployment, and ongoing site maintenance.",
    ],
  },
];

export const education = {
  degree: "BS Information Systems",
  school: "Mindanao State University – Iligan Institute of Technology",
  location: "Iligan City, Philippines",
  period: "2022 – 2026",
};

export const about = {
  lead: "Full-stack and mobile application developer, most at home in Flutter.",
  body: [
    "I build mobile and web applications end to end - interfaces, backend services, and the APIs joining them. Most of my recent work has been in Flutter, from ride-hailing and navigation apps to point-of-sale systems.",
    "I studied Information Systems at MSU-IIT, and during my internship at Anura Innovations I led the team as lead developer on Red Carpet, running code reviews and delivery milestones alongside writing the app itself.",
    "The problems I enjoy most are the ones where the hard part is people: routing someone through an unfamiliar city, matching a passenger to a driver in real time, or turning a pile of notes into something worth studying from.",
  ],
  facts: [
    { label: "Based in", value: "Oroquieta City, Philippines" },
    { label: "Focus", value: "Full-stack & mobile" },
    { label: "Available", value: "Open to opportunities" },
  ],
};

export const contact = {
  email: "reycezartigley@gmail.com",
  phone: "0966 368 5824",
  socials: [
    { label: "GitHub", href: "https://github.com/Zaimoo" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/rctigley/",
    },
  ],
};
