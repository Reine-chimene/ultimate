import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "btn-primary",
    gold: "btn-gold",
    ghost: "rounded-full px-4 py-2 text-[#f5f0e8] hover:bg-white/5 transition",
    outline: "rounded-full border border-[#c9a962]/40 px-6 py-3 text-[#c9a962] hover:bg-[#c9a962]/10 transition",
    danger: "rounded-full bg-red-900/50 px-6 py-3 text-red-200 hover:bg-red-900/70 transition",
  };
  const sizes = { sm: "text-sm px-4 py-2", md: "", lg: "text-lg px-8 py-4" };

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        "inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
