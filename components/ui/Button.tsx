import { clsx } from "clsx";
import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-fairway text-paper-raised hover:bg-fairway-bright disabled:bg-pencil-pale disabled:text-pencil",
  secondary:
    "bg-transparent text-fairway border border-fairway hover:bg-fairway-pale disabled:opacity-50",
  danger: "bg-transparent text-clay border border-clay hover:bg-clay hover:text-paper-raised",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium tracking-wide transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm font-medium tracking-wide transition-colors",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
