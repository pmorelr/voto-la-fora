import { site } from "@/lib/config";
import { cn } from "@/lib/utils";

// Estrela de cinco pontas desenhada para o projeto.
export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-6", className)}>
      <path
        d="M16 1.8 19.41 12.11 30.27 12.17 21.52 18.59 24.82 28.94 16 22.6 7.18 28.94 10.48 18.59 1.73 12.17 12.59 12.11Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Nome do site, escrito por inteiro. O L em destaque saiu em 08/10/2026, por cautela jurídica. */
export function BrandName({ suffix = "", className }: { suffix?: string; className?: string }) {
  return <span className={className}>{site.name}{suffix}</span>;
}

export function Logo({ className }: { className?: string }) {
  return <BrandName className={cn("font-serif text-[1.45rem] font-bold leading-none tracking-tight", className)} />;
}
