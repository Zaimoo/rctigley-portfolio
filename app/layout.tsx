import type { Metadata } from "next";
import { meutas } from "./fonts";
import Navbar from "../components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rey Cezar Tigley — Full-Stack & Mobile Developer",
  description:
    "Full-stack and mobile application developer based in the Philippines, building Flutter and web applications end to end.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${meutas.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
