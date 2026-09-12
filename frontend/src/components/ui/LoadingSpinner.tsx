import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-20", className)}>
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#c9a962]/30 border-t-[#c9a962]" />
    </div>
  );
}
