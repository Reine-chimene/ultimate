import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm text-[#9a8f8a]">
          {label}
        </label>
      )}
      <input id={id} className={cn("input-field", error && "border-red-500/50", className)} {...props} />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm text-[#9a8f8a]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn("input-field min-h-[100px] resize-y", error && "border-red-500/50", className)}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  className,
  id,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm text-[#9a8f8a]">
          {label}
        </label>
      )}
      <select id={id} className={cn("input-field", error && "border-red-500/50", className)} {...props}>
        {children}
      </select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
