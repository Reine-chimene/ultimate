import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  className?: string;
  centered?: boolean;
}

export function PageHeader({ title, subtitle, eyebrow, className, centered }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 md:mb-8", centered && "text-center", className)}>
      {eyebrow && <p className="section-label mb-2">{eyebrow}</p>}
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-xl text-sm text-[#9a8f8a] md:text-base">{subtitle}</p>}
    </header>
  );
}
