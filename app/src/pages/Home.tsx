import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { modules } from "@/modules/registry";
import { BigTile, ProgressRing } from "@/ui/kit";
import { useT } from "@/i18n/strings";
import { useProgress, totalSeen } from "@/store/progress";
import { loadManifest } from "@/services/content";
import { findEvictedPacks } from "@/services/downloader";
import { useDownloads } from "@/store/downloads";
import { BRAND } from "@/config";

function useModuleTotal(moduleId: string, enabled: boolean) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    loadManifest(moduleId).then((m) => setTotal(m.packs.reduce((a, p) => a + p.count, 0))).catch(() => undefined);
  }, [moduleId, enabled]);
  return total;
}

function ModuleTile({ id }: { id: string }) {
  const t = useT();
  const mod = modules.find((x) => x.id === id)!;
  const ready = mod.status === "ready";
  const total = useModuleTotal(id, ready && !!mod.progressUnits);
  const prog = useProgress((s) => s.modules[id]);
  const seen = totalSeen(prog);
  return (
    <BigTile to={mod.route} color={ready ? mod.color : "#9a9a9a"} disabled={!ready} ribbon={ready ? undefined : t("home.coming")}
      className="flex min-h-40 flex-col justify-between p-5">
      <div className="flex items-start justify-between">
        <span className="text-6xl" aria-hidden>{mod.icon}</span>
        {ready && total > 0 && <ProgressRing value={seen / total} size={56} stroke={7}>{Math.round((seen / total) * 100)}%</ProgressRing>}
      </div>
      <div>
        <div lang="bn" className="text-3xl font-extrabold leading-tight">{mod.titleBn}</div>
        <div className="text-lg font-bold">{mod.titleEn}</div>
      </div>
    </BigTile>
  );
}

export default function Home() {
  const t = useT();
  const [evicted, setEvicted] = useState(false);
  const hasDownloads = useDownloads((s) => Object.keys(s.packs).length > 0);
  useEffect(() => {
    if (!hasDownloads) return;
    const id = window.setTimeout(() => void findEvictedPacks().then((e) => setEvicted(e.length > 0)), 1500);
    return () => clearTimeout(id);
  }, [hasDownloads]);

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col">
      <header className="safe-pt safe-px flex items-center justify-between gap-3 pb-2 pt-3">
        <div className="min-w-0 leading-tight">
          <h1 className="text-2xl font-extrabold text-teal sm:text-3xl">{BRAND.nameEn}</h1>
          <p lang="bn" className="text-lg font-bold text-soft">{BRAND.nameBn}</p>
        </div>
        <Link to="/parent" aria-label={t("common.grownups")} className="flex min-h-16 min-w-16 flex-col items-center justify-center rounded-2xl bg-white px-3 text-xs font-bold text-soft shadow-soft">
          <span className="text-2xl" aria-hidden>⚙️</span>{t("common.grownups")}
        </Link>
      </header>
      <main className="safe-px safe-pb flex-1">
        <h2 className="mb-4 mt-2 text-2xl font-extrabold">{t("home.title")}</h2>
        {evicted && <p role="alert" className="mb-4 rounded-2xl bg-sun/30 p-3 font-bold">{t("home.evicted")}</p>}
        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3">
          {[...modules].sort((a, b) => Number(b.status === "ready") - Number(a.status === "ready")).map((m) => <ModuleTile key={m.id} id={m.id} />)}
        </div>
      </main>
    </div>
  );
}
