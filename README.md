# Cezar Portfolio

Personal portfolio for Rey Cezar Tigley, built with Next.js, React, TypeScript,
Tailwind CSS, and React Three Fiber.

## Requirements

- Node.js 20 or newer
- npm

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## Project Structure

- `app/` - application layout, page, fonts, and global styles
- `components/` - reusable portfolio sections and project presentation
- `lib/content.ts` - portfolio copy, project metadata, skills, experience, and contact details
- `public/images/projects/` - project screenshots and other static assets

## Updating Content

Most portfolio content can be edited in `lib/content.ts`. Project images should
be placed in `public/images/projects/` and referenced with a path beginning with
`/images/projects/`.

Use `shots` for portrait mobile screenshots. Use `media` for a single website
image or other landscape project asset. Projects without an image can use the
optional `placeholder` field to display a custom message.

## Production Check

Run the production checks before deploying:

```bash
npm run lint
npm run build
```

The application can be deployed to any platform that supports Next.js. Vercel
is the simplest option for a standard Next.js deployment.
