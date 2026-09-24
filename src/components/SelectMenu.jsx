import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "../lib/motion";

export default function SelectMenu({
  value,
  options,
  onChange,
  onOpenChange,
  ariaLabel,
  placeholder = "Select",
  className = "",
  disabled = false,
  reduceMotion = false,
}) {
  const globalReduceMotion = useReducedMotion(reduceMotion);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const optionRefs = useRef([]);
  const closeTimer = useRef(null);
  const listboxId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  const openMenu = useCallback(() => {
    if (disabled) return;
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setMounted(true);
    setClosing(false);
    setOpen(true);
    onOpenChange?.(true);
  }, [disabled, onOpenChange]);

  const closeMenu = useCallback(
    (returnFocus = false) => {
      if (!open && !mounted) return;
      setOpen(false);
      setClosing(true);
      onOpenChange?.(false);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => {
        setMounted(false);
        setClosing(false);
        closeTimer.current = null;
      }, globalReduceMotion ? 0 : 180);
      if (returnFocus) {
        window.requestAnimationFrame(() =>
          rootRef.current?.querySelector("button")?.focus(),
        );
      }
    },
    [globalReduceMotion, mounted, onOpenChange, open],
  );

  useEffect(() => {
    if (!globalReduceMotion || !closeTimer.current) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setMounted(false);
    setClosing(false);
  }, [globalReduceMotion]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) closeMenu();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() =>
      optionRefs.current[selectedIndex]?.focus(),
    );
  }, [open, selectedIndex]);

  const choose = (option) => {
    onChange?.(option.value);
    closeMenu(true);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const next = (current + direction + options.length) % options.length;
        optionRefs.current[next]?.focus();
        return next;
      });
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.focus();
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      const last = options.length - 1;
      setActiveIndex(last);
      optionRefs.current[last]?.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className={`select-menu ${open ? "open" : ""} ${
        closing ? "closing" : ""
      } ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="select-menu-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        <span className="select-menu-value">
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {mounted && (
        <div
          id={listboxId}
          className={`select-menu-content ${open ? "is-open" : "is-closed"}`}
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option, index) => (
            <button
              key={String(option.value)}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`select-menu-option ${
                option.value === value ? "selected" : ""
              }`}
              tabIndex={index === activeIndex ? 0 : -1}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
