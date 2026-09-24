import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export default function ValidationMessage({
  id,
  children,
  tone = "error",
  visible = true,
  className = "",
}) {
  if (!visible || !children) return null;
  const Icon = icons[tone] || AlertCircle;
  return (
    <div
      id={id}
      className={`field-validation field-validation-${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
