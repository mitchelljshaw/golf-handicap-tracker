import { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

const controlClasses =
  "w-full rounded-sm border border-pencil-pale bg-paper-raised px-3 py-2 text-ink placeholder:text-pencil focus:border-fairway";

export function Label({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={clsx(
        "mb-1 block text-xs font-semibold uppercase tracking-wider text-pencil",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(controlClasses, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={clsx(controlClasses, className)} {...props}>
      {children}
    </select>
  );
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
