import Image from "next/image";

export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <a
      href="#header"
      aria-label="Rey Cezar Tigley — home"
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${className}`}
    >
      <Image src="/logo.svg" alt="" width={40} height={40} />
    </a>
  );
}
