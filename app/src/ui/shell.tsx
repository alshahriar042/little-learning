import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useT } from "@/i18n/strings";
import { useSettings } from "@/store/settings";

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    window.addEventListener("online", up); window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return on;
}

export function OfflineChip() {
  const t = useT();
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="pointer-events-none fixed left-1/2 top-[max(env(safe-area-inset-top),0.5rem)] z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-1.5 text-sm font-bold text-white shadow-soft">
      📴 {t("common.offline")}
    </div>
  );
}

export function UpdatePrompt() {
  const t = useT();
  const { needRefresh: [need, setNeed], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) { if (reg) setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000); },
  });
  if (!need) return null;
  return (
    <div role="alert" className="safe-pb fixed inset-x-0 bottom-0 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-soft">
        <span className="font-bold">{t("update.new")}</span>
        <button className="min-h-11 rounded-xl bg-sun px-4 font-extrabold text-ink" onClick={() => void updateServiceWorker(true)}>{t("update.btn")}</button>
        <button className="min-h-11 rounded-xl px-3 font-bold text-white/80" onClick={() => setNeed(false)}>{t("update.later")}</button>
      </div>
    </div>
  );
}

/** Keep <html lang> in step with the UI language. */
export function useHtmlLang() {
  const lang = useSettings((s) => s.uiLang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
}

/** Page frame: safe-area header with back button, title and optional right-hand slot. */
export function Screen({ title, titleBn, color = "#2f9e8f", back, right, children }: {
  title: string; titleBn?: string; color?: string; back?: string | number; right?: ReactNode; children: ReactNode;
}) {
  const t = useT();
  const nav = useNavigate();
  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
      <header className="safe-pt safe-px sticky top-0 z-30 flex items-center gap-3 pb-3 pt-2 text-white" style={{ backgroundColor: color }}>
        {back !== undefined && (
          <button type="button" aria-label={t("common.back")} onClick={() => (typeof back === "number" ? nav(back) : nav(back))}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/25 text-3xl active:scale-90">←</button>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate text-xl font-extrabold">{title}</h1>
          {titleBn && <p lang="bn" className="truncate text-lg font-bold opacity-95">{titleBn}</p>}
        </div>
        {right}
      </header>
      <main className="safe-px safe-pb flex-1 pt-4">{children}</main>
    </div>
  );
}

export function HomeLink() {
  const t = useT();
  return <Link to="/" aria-label={t("common.home")} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-2xl">🏠</Link>;
}
