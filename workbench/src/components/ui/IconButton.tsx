import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import "./IconButton.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
}

export function IconButton({ icon: Icon, label, ...buttonProps }: IconButtonProps) {
  return (
    <button
      {...buttonProps}
      className={`icon-button ${buttonProps.className ?? ""}`.trim()}
      title={label}
      aria-label={label}
      type={buttonProps.type ?? "button"}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={2} />
    </button>
  );
}
