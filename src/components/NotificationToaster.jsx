import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useApp } from "../App";
import { notificationDuration } from "../lib/notifications";
import { useReducedMotion } from "../lib/motion";

const toneDetails = {
  success: { Icon: CheckCircle2, titleKey: "notifications.success" },
  error: { Icon: XCircle, titleKey: "notifications.error" },
  warning: { Icon: AlertTriangle, titleKey: "notifications.warning" },
  info: { Icon: Info, titleKey: "notifications.info" },
};

function NotificationCard({
  notification,
  isDismissing,
  isPaused,
  onDismiss,
  onPause,
  onResume,
  t,
  reduceMotion,
}) {
  const tone = toneDetails[notification.tone] || toneDetails.info;
  const Icon = tone.Icon;
  const duration = notification.duration || notificationDuration(notification.tone);

  return (
    <article
      className={`notification-card notification-${notification.tone} ${
        isDismissing ? "is-dismissing" : ""
      } ${isPaused ? "is-paused" : ""} ${
        reduceMotion ? "notification-reduce-motion" : ""
      }`}
      style={{ "--notification-duration": `${duration}ms` }}
      role={notification.tone === "error" ? "alert" : "status"}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocusCapture={onPause}
      onBlurCapture={onResume}
    >
      <div className="notification-icon" aria-hidden="true">
        <Icon size={17} strokeWidth={2.3} />
      </div>
      <div className="notification-copy">
        <div className="notification-heading">
          <strong>{t(tone.titleKey)}</strong>
          <span className="notification-new">{t("notifications.new")}</span>
        </div>
        <p>{t(notification.key, notification.values)}</p>
      </div>
      <button
        type="button"
        className="notification-close"
        onClick={() => onDismiss(notification.id)}
        aria-label={t("notifications.dismiss")}
        title={t("notifications.dismiss")}
      >
        <X size={15} />
      </button>
      <span className="notification-progress" aria-hidden="true" />
    </article>
  );
}

export default function NotificationToaster() {
  const {
    notifications,
    dismissNotification,
    clearNotifications,
    settings,
    t,
  } = useApp();
  const [dismissing, setDismissing] = useState(() => new Set());
  const [paused, setPaused] = useState(false);
  const autoTimers = useRef(new Map());
  const dismissTimers = useRef(new Map());
  const globalReduceMotion = useReducedMotion();
  const reduceMotion = Boolean(settings?.reduceMotion || globalReduceMotion);

  const beginDismiss = useCallback(
    (id) => {
      if (dismissTimers.current.has(id)) return;
      setDismissing((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        return next;
      });
      const timer = window.setTimeout(
        () => {
          dismissTimers.current.delete(id);
          dismissNotification(id);
          setDismissing((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        },
        reduceMotion ? 0 : 280,
      );
      dismissTimers.current.set(id, timer);
    },
    [dismissNotification, reduceMotion],
  );

  useEffect(() => {
    autoTimers.current.forEach((timer) => window.clearTimeout(timer));
    autoTimers.current.clear();
    if (paused) return undefined;

    notifications.forEach((notification) => {
      if (dismissing.has(notification.id)) return;
      const duration = notification.duration || notificationDuration(notification.tone);
      const timer = window.setTimeout(
        () => beginDismiss(notification.id),
        duration,
      );
      autoTimers.current.set(notification.id, timer);
    });
    return undefined;
  }, [beginDismiss, dismissing, notifications, paused]);

  useEffect(
    () => () => {
      autoTimers.current.forEach((timer) => window.clearTimeout(timer));
      dismissTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  if (!notifications.length) return null;

  return (
    <aside
      className={`notification-viewport ${paused ? "is-paused" : ""}`}
      aria-label={t("notifications.title")}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
    >
      <div className="notification-toolbar">
        <span className="notification-toolbar-title">
          <Bell size={13} />
          {t("notifications.title")}
        </span>
        <button
          type="button"
          className="notification-clear"
          onClick={clearNotifications}
          aria-label={t("notifications.clearAll")}
          title={t("notifications.clearAll")}
        >
          <Trash2 size={13} />
          <span>{t("notifications.clearAll")}</span>
        </button>
      </div>
      <div className="notification-stack">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            isDismissing={dismissing.has(notification.id)}
            isPaused={paused}
            onDismiss={beginDismiss}
            onPause={() => setPaused(true)}
            onResume={() => setPaused(false)}
            t={t}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </aside>
  );
}
