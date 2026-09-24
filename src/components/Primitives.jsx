import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  LockKeyhole,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../App";
import { formatLocalizedInteger } from "../lib/numerals";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconAfter: IconAfter,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button button-${variant} button-${size} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} />}
      {children}
      {IconAfter && <IconAfter size={size === "sm" ? 15 : 17} />}
    </button>
  );
}

export function LinkButton({
  children,
  to,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <Link
      to={to}
      className={`button button-${variant} button-${size} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 15 : 17} />}
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}) {
  return (
    <div className={`page-header ${className}`}>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
      {children}
    </div>
  );
}

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <section
      className={`card ${hover ? "card-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, action, className = "" }) {
  return (
    <div className={`section-heading ${className}`}>
      <div>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
  icon: Icon,
  className = "",
}) {
  return (
    <span className={`pill pill-${tone} ${className}`}>
      {Icon && <Icon size={13} />}
      {children}
    </span>
  );
}

export function ProgressBar({
  value = 0,
  max = 100,
  tone = "lime",
  label,
  showValue = false,
}) {
  const { settings } = useApp();
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showValue && (
            <strong>
              {formatLocalizedInteger(Math.round(percentage), settings.locale)}%
            </strong>
          )}
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill fill-${tone}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function RingProgress({
  value = 0,
  label,
  sublabel,
  tone = "lime",
  size = 104,
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div
      className={`ring-progress ring-${tone}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle
          className="ring-value"
          cx="50"
          cy="50"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dash}
        />
      </svg>
      <div className="ring-label">
        <strong>{label}</strong>
        <span>{sublabel}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={21} />
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "lime",
  trend,
}) {
  return (
    <Card className={`stat-card stat-${tone}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon size={17} />
          </span>
        )}
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-foot">
        {hint}
        {trend && <span className="trend-up">{trend}</span>}
      </div>
    </Card>
  );
}

export function DifficultyBadge({ difficulty }) {
  const { t } = useApp();
  const label = t(`difficulty.${difficulty}`);
  return (
    <span className={`difficulty-badge difficulty-${difficulty}`}>{label}</span>
  );
}

export function CodeSlots({
  value = "",
  displayValue,
  length = 4,
  invalid = false,
}) {
  const visibleValue = displayValue ?? value;
  return (
    <div className={`code-slots ${invalid ? "invalid" : ""}`}>
      {Array.from({ length }, (_, index) => (
        <span className="code-slot" key={index}>
          {visibleValue[index] || "·"}
        </span>
      ))}
    </div>
  );
}

export function WordSlots({ value = "", placeholder = "", invalid = false }) {
  return (
    <div className={`word-slots ${invalid ? "invalid" : ""}`}>
      <span>{value || placeholder}</span>
    </div>
  );
}

export function MiniStat({ icon: Icon, label, value, tone = "neutral" }) {
  return (
    <div className={`mini-stat mini-${tone}`}>
      <Icon size={15} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function FeatureIcon({ type = "spark" }) {
  if (type === "trophy") return <Trophy size={19} />;
  if (type === "lock") return <LockKeyhole size={19} />;
  if (type === "help") return <CircleHelp size={19} />;
  return <Sparkles size={19} />;
}

export function NextArrow() {
  return <ArrowRight size={17} />;
}
export function CheckMark() {
  return <Check size={16} />;
}
export function Chevron() {
  return <ChevronRight size={17} />;
}
