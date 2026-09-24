import localFont from "next/font/local";

const meutas = localFont({
  src: [
    { path: "../public/Meutas-Light.otf", weight: "300", style: "normal" },
    { path: "../public/Meutas-Bold.otf", weight: "700", style: "normal" },
    { path: "../public/Meutas-Black.otf", weight: "900", style: "normal" },
    {
      path: "../public/Meutas-BlackOblique.otf",
      weight: "900",
      style: "oblique",
    },
  ],
  variable: "--font-meutas",
  display: "swap",
});

export { meutas };
