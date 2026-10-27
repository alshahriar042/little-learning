import { useEffect, useMemo, useRef, type ButtonHTMLAttributes, type ReactNode, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { darken } from "@/lib/color";

/** Large, friendly tile. Renders a router Link when `to` is set, else a button. Min 64px touch target. */
export function BigTile({
  to, onClick, color, children, className = "", disabled, ribbon, label,
}: { to?: string; onClick?: () => void; color: string; children: ReactNode; className?: string; disabled?: boolean; ribbon?: string; label?: string }) {
  const cls = `relative block w-full min-h-16 rounded-3xl text-left shadow-soft transition-transform active:scale-95 ${disabled ? "grayscale" : ""} ${className}`;
  const style = { backgroundColor: darken(color, 0.28), color: "#fff" };
  const inner = (
    <>
      {children}
      {ribbon && (
        <span className="absolute -right-2 top-3 rotate-6 rounded-md bg-sun px-3 py-1 text-sm font-extrabold text-ink shadow">{ribbon}</span>
      )}
    </>
  );
  return to ? (
    <Link to={to} className={cls} style={style} aria-label={label}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} style={style} aria-label={label}>{inner}</button>
  );
}

export function ProgressRing({ value, size = 64, stroke = 8, color = "#fff", track = "rgba(255,255,255,.35)", children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(v * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">{children}</div>
    </div>
  );
}

export function StarBurst({ show, size = 120 }: { show: boolean; size?: number }) {
  if (!show) return null;
  return (
    <m.div aria-hidden className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.2, 1, 1.4] }} transition={{ duration: 1.2 }}>
      <span style={{ fontSize: size }}>⭐</span>
    </m.div>
  );
}

export function Confetti({ show, count = 36 }: { show: boolean; count?: number }) {
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 0.4, rot: Math.random() * 360, color: ["#f6a21e", "#d94a4a", "#2b86c5", "#3aa05a", "#8e5bbf", "#d6478a"][i % 6],
  })), [count, show]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {bits.map((b) => (
        <m.span key={b.id} className="absolute top-0 block h-3 w-2 rounded-sm" style={{ left: `${b.x}%`, backgroundColor: b.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }} animate={{ y: "105vh", rotate: b.rot + 540, opacity: [1, 1, 0.8] }} transition={{ duration: 2 + b.delay, delay: b.delay, ease: "easeIn" }} />
      ))}
    </div>
  );
}

export function AudioButton({ onClick, label, size = 64, className = "", ...rest }: { onClick: () => void; label: string; size?: number; className?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  return (
    <button type="button" onClick={onClick} aria-label={label} style={{ width: size, height: size }}
      className={`flex items-center justify-center rounded-full bg-sun text-3xl shadow-soft active:scale-90 transition-transform ${className}`} {...rest}>
      <span aria-hidden>🔊</span>
    </button>
  );
}

/** Horizontal swipe detector (pointer events, no drag library). Vertical scrolling stays native. */
export function PageSwipe({ onSwipe, children, className = "" }: { onSwipe: (dir: "left" | "right") => void; children: ReactNode; className?: string }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (e: PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; };
  const up = (e: PointerEvent) => {
    const s = start.current; start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipe(dx < 0 ? "left" : "right");
  };
  return <div className={className} style={{ touchAction: "pan-y" }} onPointerDown={down} onPointerUp={up} onPointerCancel={() => (start.current = null)}>{children}</div>;
}

/** Run `fn` every `ms` while `active`. */
export function useInterval(fn: () => void, ms: number, active: boolean) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms, active]);
}
