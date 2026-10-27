import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Screen } from "@/ui/shell";
import { ParentalGate } from "@/ui/ParentalGate";
import { ProgressRing } from "@/ui/kit";
import { stickerFor } from "@/ui/Rewards";
import { useT } from "@/i18n/strings";
import { isUnlocked, useGate } from "@/lib/gate";
import { downloadableModules, modules } from "@/modules/registry";
import { enabledFor, useSettings } from "@/store/settings";
import { useProgress, totalSeen } from "@/store/progress";
import { useDownloads } from "@/store/downloads";
import { loadManifest } from "@/services/content";
import { cancelDownload, checkContentUpdate, downloadPack, removeDownloads, updateModuleContent, useJobs, type UpdateInfo } from "@/services/downloader";
import { formatBytes, isPersisted, requestPersistence, storageEstimate } from "@/services/assetCache";
import { voiceStatus, onVoicesChanged, speak } from "@/services/speech";
import type { Manifest } from "@/lib/schemas";

/** Renders children only after the parental gate has been passed (valid for 10 minutes). */
export function Gated({ title, titleBn, back, children }: { title: string; titleBn?: string; back: string; children: ReactNode }) {
  const until = useGate((s) => s.until);
  const unlock = useGate((s) => s.unlock);
  const nav = useNavigate();
  if (isUnlocked(until)) return <>{children}</>;
  return <Screen title={title} titleBn={titleBn} back={back}><ParentalGate onPass={unlock} onCancel={() => nav(back)} /></Screen>;
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mb-5 rounded-3xl bg-white p-4 shadow-soft"><h2 className="mb-3 text-xl font-extrabold">{title}</h2>{children}</section>
);
const Seg = <T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label: string }) => (
  <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} onClick={() => onChange(o.v)}
        className={`min-h-14 min-w-16 flex-1 rounded-2xl px-3 text-lg font-extrabold ${o.v === value ? "bg-teal-bg text-white" : "bg-cream"}`}>{o.l}</button>
    ))}
  </div>
);
const Row = ({ label, children }: { label: string; children: ReactNode }) => <div className="mb-4"><p className="mb-2 font-bold text-soft">{label}</p>{children}</div>;

function SettingsCard() {
  const t = useT();
  const s = useSettings();
  const [vs, setVs] = useState(voiceStatus());
  useEffect(() => { const off = onVoicesChanged(() => setVs(voiceStatus())); return () => { off(); }; }, []);
  const [packs, setPacks] = useState<Manifest["packs"]>([]);
  useEffect(() => { loadManifest("picture-words").then((m) => setPacks(m.packs)).catch(() => undefined); }, []);
  const enabled = enabledFor("picture-words", packs.map((p) => p.id), s.enabledSections);
  return (
    <Card title="⚙️ Settings · সেটিংস">
      <Row label={`${t("parent.lang")} / ভাষা`}><Seg label={t("parent.lang")} value={s.uiLang} onChange={(v) => s.set({ uiLang: v })} options={[{ v: "bn", l: "বাংলা" }, { v: "en", l: "English" }]} /></Row>
      <Row label={t("parent.speech")}><Seg label={t("parent.speech")} value={s.speechMode} onChange={(v) => s.set({ speechMode: v })} options={[{ v: "en", l: t("parent.speechEn") }, { v: "bn", l: t("parent.speechBn") }, { v: "both", l: t("parent.speechBoth") }]} /></Row>
      <Row label={t("parent.sound")}><Seg label={t("parent.sound")} value={s.sound ? "on" : "off"} onChange={(v) => s.set({ sound: v === "on" })} options={[{ v: "on", l: "🔊 On" }, { v: "off", l: "🔇 Off" }]} /></Row>
      <Row label={`${t("parent.speed")}: ${s.rate.toFixed(2)}×`}>
        <div className="flex items-center gap-3"><span>🐢</span>
          <input type="range" min={0.5} max={1.2} step={0.05} value={s.rate} aria-label={t("parent.speed")} onChange={(e) => s.set({ rate: Number(e.target.value) })} className="h-10 flex-1 accent-teal-bg" />
          <span>🐇</span>
          <button type="button" className="min-h-14 rounded-2xl bg-sun px-4 text-xl font-extrabold" aria-label="test" onClick={() => void speak({ en: "Tiger", bn: "বাঘ" }, "picture-words")}>▶</button>
        </div>
      </Row>
      {!vs.supported && <p className="mb-3 rounded-xl bg-sun/30 p-3 font-bold">{t("parent.noTts")}</p>}
      {vs.supported && !vs.bn && <p className="mb-3 rounded-xl bg-sun/30 p-3 font-bold">{t("parent.noBn")}</p>}
      <Row label={`${t("parent.auto")}: ${s.autoplaySeconds}`}><Seg label={t("parent.auto")} value={s.autoplaySeconds} onChange={(v) => s.set({ autoplaySeconds: v })} options={[2, 4, 6, 8].map((v) => ({ v, l: String(v) }))} /></Row>
      <Row label={t("parent.pairs")}><Seg label={t("parent.pairs")} value={s.matchPairs} onChange={(v) => s.set({ matchPairs: v })} options={[3, 4, 6].map((v) => ({ v: v as 3 | 4 | 6, l: String(v) }))} /></Row>
      {packs.length > 0 && (
        <Row label={t("parent.gameSections")}>
          <div className="flex flex-wrap gap-2">
            {packs.map((p) => {
              const on = enabled.includes(p.id);
              return <button key={p.id} type="button" aria-pressed={on} onClick={() => s.toggleSection("picture-words", p.id, packs.map((x) => x.id))}
                className={`min-h-12 rounded-full px-4 text-base font-bold ${on ? "bg-teal-bg text-white" : "bg-cream line-through"}`}><span lang="bn">{p.titleBn}</span></button>;
            })}
          </div>
        </Row>
      )}
    </Card>
  );
}

function ProgressBar({ job }: { job: { done: number; total: number } }) {
  return <progress className="h-3 w-full accent-teal-bg" value={job.done} max={Math.max(1, job.total)} aria-label={`${job.done}/${job.total}`} />;
}

function DownloadRow({ moduleId, packId, title, bytes, indent }: { moduleId: string; packId: string; title: string; bytes: number; indent?: boolean }) {
  const t = useT();
  const key = `${moduleId}:${packId}`;
  const job = useJobs((s) => s.jobs[key]);
  const done = useDownloads((s) => (packId === "*" ? false : !!s.packs[key]));
  const running = job?.status === "running";
  return (
    <div className={`mb-2 rounded-2xl bg-cream p-3 ${indent ? "ml-3" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0"><p className="truncate font-extrabold" lang={indent ? "bn" : undefined}>{title}</p><p className="text-sm text-soft">{formatBytes(bytes)}</p></div>
        {running
          ? <button type="button" className="min-h-12 rounded-xl bg-white px-4 font-bold" onClick={() => cancelDownload(moduleId, packId)}>{t("parent.cancel")}</button>
          : <button type="button" data-testid={`dl-${packId}`} data-state={done || job?.status === "done" ? "done" : job?.status === "error" ? "error" : "idle"} className="min-h-12 rounded-xl bg-teal-bg px-4 font-extrabold text-white" onClick={() => void downloadPack(moduleId, packId)}>
              {done || job?.status === "done" ? t("parent.downloaded") : job?.status === "error" ? t("parent.redownload") : t("parent.download")}</button>}
      </div>
      {running && <div className="mt-2"><ProgressBar job={job} /><p className="text-sm font-bold">{job.done} / {job.total}</p></div>}
      {job?.status === "error" && <p role="alert" className="mt-1 text-sm font-bold text-berry">{t("parent.failed")}</p>}
    </div>
  );
}

function ModuleDownloads({ moduleId, titleEn, titleBn }: { moduleId: string; titleEn: string; titleBn: string }) {
  const t = useT();
  const [m, setM] = useState<Manifest | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { loadManifest(moduleId).then(setM).catch(() => undefined); }, [moduleId]);
  if (!m) return null;
  return (
    <div className="mb-4">
      <DownloadRow moduleId={moduleId} packId="*" title={`${titleEn} · ${titleBn}`} bytes={m.packs.reduce((a, p) => a + p.bytes, 0)} />
      <button type="button" data-testid="dl-expand" aria-expanded={open} onClick={() => setOpen(!open)} className="mb-2 min-h-12 px-2 font-bold text-teal underline">{t("parent.sectionsDl")} {open ? "▲" : "▼"}</button>
      {open && m.packs.map((p) => <DownloadRow key={p.id} indent moduleId={moduleId} packId={p.id} title={p.titleBn} bytes={p.bytes} />)}
    </div>
  );
}

function OfflineCard() {
  const t = useT();
  const mods = downloadableModules();
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  const [persisted, setPersisted] = useState(false);
  const jobs = useJobs((s) => s.jobs);
  const refresh = () => { void storageEstimate().then(setEst); void isPersisted().then(setPersisted); };
  useEffect(refresh, [jobs]);
  const all = useJobs((s) => s.jobs["picture-words:*"]);
  return (
    <Card title={`📥 ${t("parent.offline")}`}>
      <button type="button" className="mb-4 min-h-16 w-full rounded-2xl bg-sun text-xl font-extrabold shadow-soft"
        onClick={() => { void requestPersistence().then(setPersisted); mods.forEach((m) => void downloadPack(m.id, "*")); }}>⬇ {t("parent.downloadAll")}</button>
      {all?.status === "running" && <ProgressBar job={all} />}
      {mods.map((m) => <ModuleDownloads key={m.id} moduleId={m.id} titleEn={m.titleEn} titleBn={m.titleBn} />)}
      <p className="font-bold">{t("parent.storage")}: {est ? `${formatBytes(est.usage)} / ${formatBytes(est.quota)}` : "—"}</p>
      <button type="button" disabled={persisted} className="mt-2 min-h-12 rounded-xl bg-cream px-4 font-bold disabled:opacity-60" onClick={() => void requestPersistence().then(setPersisted)}>
        {persisted ? t("parent.persisted") : t("parent.persist")}</button>
      <button type="button" className="ml-2 mt-2 min-h-12 rounded-xl bg-berry px-4 font-bold text-white"
        onClick={() => { if (confirm(t("parent.removeConfirm"))) void removeDownloads().then(refresh); }}>🗑 {t("parent.remove")}</button>
    </Card>
  );
}

function UpdatesCard() {
  const t = useT();
  const [updates, setUpdates] = useState<UpdateInfo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const check = async () => { setBusy(true); const r = await Promise.all(downloadableModules().map((m) => checkContentUpdate(m.id))); setUpdates(r.filter((x): x is UpdateInfo => !!x)); setBusy(false); };
  useEffect(() => { void check(); }, []);
  return (
    <Card title={`🔄 ${t("parent.updates")}`}>
      {updates?.length === 0 && <p className="mb-2 font-bold">{t("parent.upToDate")}</p>}
      {updates?.map((u) => (
        <div key={u.moduleId} className="mb-2 flex items-center justify-between gap-2 rounded-2xl bg-sun/30 p-3">
          <span className="font-extrabold">{t("parent.newContent")}: {modules.find((m) => m.id === u.moduleId)?.titleEn}</span>
          <button type="button" className="min-h-12 rounded-xl bg-teal-bg px-4 font-extrabold text-white" onClick={() => void updateModuleContent(u.moduleId).then(check)}>{t("parent.updateNow")}</button>
        </div>
      ))}
      <button type="button" disabled={busy} className="min-h-12 rounded-xl bg-cream px-4 font-bold" onClick={() => void check()}>{t("parent.check")}</button>
    </Card>
  );
}

function ProgressCard() {
  const t = useT();
  const prog = useProgress();
  const [totals, setTotals] = useState<Record<string, number>>({});
  useEffect(() => { void Promise.all(downloadableModules().map(async (m) => [m.id, (await loadManifest(m.id)).packs.reduce((a, p) => a + p.count, 0)] as const)).then((e) => setTotals(Object.fromEntries(e))); }, []);
  return (
    <Card title={`⭐ ${t("parent.progress")}`}>
      {downloadableModules().map((m) => {
        const mp = prog.modules[m.id];
        const seen = totalSeen(mp), total = totals[m.id] ?? 0;
        return (
          <div key={m.id} className="mb-3 flex items-center gap-4">
            <ProgressRing value={total ? seen / total : 0} size={64} stroke={8} color="#2f9e8f" track="#e5e7eb">{total ? Math.round((seen / total) * 100) : 0}%</ProgressRing>
            <div><p className="text-lg font-extrabold">{m.titleEn} · <span lang="bn">{m.titleBn}</span></p>
              <p className="text-soft">⭐ {mp?.stars ?? 0} · {(mp?.stickers ?? []).map(stickerFor).join(" ") || "—"}</p></div>
          </div>
        );
      })}
      <button type="button" className="min-h-12 rounded-xl bg-berry px-4 font-bold text-white" onClick={() => { if (confirm(t("parent.resetConfirm"))) prog.reset(); }}>{t("parent.reset")}</button>
    </Card>
  );
}

export default function Parent() {
  const t = useT();
  const lock = useGate((s) => s.lock);
  const nav = useNavigate();
  return (
    <Gated title={t("parent.title")} back="/">
      <Screen title={t("parent.title")} titleBn="বড়দের কর্নার" back="/" right={<button type="button" onClick={() => { lock(); nav("/"); }} className="min-h-12 rounded-full bg-white/25 px-4 font-bold">🔒 {t("parent.exit")}</button>}>
        <div className="mx-auto max-w-2xl">
          <SettingsCard />
          <OfflineCard />
          <UpdatesCard />
          <ProgressCard />
          <Card title={`ℹ️ ${t("parent.about")}`}>
            <p className="mb-3">{t("parent.aboutText")}</p>
            <h3 className="font-extrabold">{t("parent.privacy")}</h3><p className="mb-3">{t("parent.privacyText")}</p>
            <h3 className="font-extrabold">{t("parent.install")}</h3><p className="mb-3">{t("parent.installText")}</p>
            <Link to="/parent/credits" className="inline-flex min-h-14 items-center rounded-2xl bg-teal-bg px-5 text-lg font-extrabold text-white">📷 {t("parent.credits")}</Link>
          </Card>
        </div>
      </Screen>
    </Gated>
  );
}
