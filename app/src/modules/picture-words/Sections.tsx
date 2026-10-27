import { Link } from "react-router-dom";
import { Screen, HomeLink } from "@/ui/shell";
import { BigTile, ProgressRing } from "@/ui/kit";
import { stickerFor } from "@/ui/Rewards";
import { useT } from "@/i18n/strings";
import { useProgress, seenCount } from "@/store/progress";
import { ItemPicture, MODULE_ID, usePW } from "./data";

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="mb-4 text-xl font-bold">{t("pw.missing")}</p>
      <button className="min-h-16 rounded-2xl bg-teal-bg px-8 text-xl font-extrabold text-white" onClick={onRetry}>{t("common.retry")}</button>
    </div>
  );
}

export default function Sections() {
  const t = useT();
  const { data, error, retry } = usePW();
  const prog = useProgress((s) => s.modules[MODULE_ID]);
  return (
    <Screen title="Picture Words" titleBn="ছবিতে শব্দ" color="#e8892b" back="/" right={<HomeLink />}>
      {error && <LoadError onRetry={retry} />}
      {!data && !error && <p className="p-6 text-center text-lg font-bold">{t("common.loading")}</p>}
      {data && (
        <>
          <Link to="/m/picture-words/games" className="mb-4 flex min-h-20 items-center justify-between rounded-3xl bg-teal-bg px-6 text-white shadow-soft active:scale-95">
            <span className="text-2xl font-extrabold">🎮 {t("pw.games")} <span lang="bn" className="ml-1">খেলা</span></span>
            <span className="rounded-full bg-black/25 px-3 py-1 text-lg font-extrabold">⭐ {prog?.stars ?? 0}</span>
          </Link>
          <h2 className="mb-3 text-xl font-extrabold">{t("pw.sections")}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {data.sections.map((s, idx) => {
              const items = data.bySection[s.id] ?? [];
              const seen = seenCount(prog, s.id);
              const got = prog?.stickers.includes(s.id);
              return (
                <BigTile key={s.id} to={`/m/picture-words/${s.id}`} color={s.color} className="flex flex-col overflow-hidden">
                  <div className="p-2 pb-0">
                    <ItemPicture item={items[0]} assets={data.assets} className="rounded-2xl" ratio={[4, 3]} priority={idx < 4} />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0 leading-tight">
                      <div lang="bn" className="truncate text-xl font-extrabold">{s.nameBn}</div>
                      <div className="truncate text-sm font-bold">{s.nameEn}</div>
                    </div>
                    {got ? <span className="text-4xl" aria-label="sticker">{stickerFor(s.id)}</span>
                      : <ProgressRing value={items.length ? seen / items.length : 0} size={48} stroke={6}>{seen}</ProgressRing>}
                  </div>
                </BigTile>
              );
            })}
          </div>
        </>
      )}
    </Screen>
  );
}
