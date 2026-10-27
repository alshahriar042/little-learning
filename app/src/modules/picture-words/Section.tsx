import { useNavigate, useParams } from "react-router-dom";
import { Screen, HomeLink } from "@/ui/shell";
import { useT } from "@/i18n/strings";
import { ItemPicture, MODULE_ID, usePW } from "./data";
import { LoadError } from "./Sections";

export default function Section() {
  const { sectionId } = useParams();
  const t = useT();
  const nav = useNavigate();
  const { data, error, retry } = usePW();
  const section = data?.sections.find((s) => s.id === sectionId);
  const items = (sectionId && data?.bySection[sectionId]) || [];
  return (
    <Screen title={section?.nameEn ?? "…"} titleBn={section?.nameBn} color={section?.color} back="/m/picture-words" right={<HomeLink />}>
      {error && <LoadError onRetry={retry} />}
      {!data && !error && <p className="p-6 text-center text-lg font-bold">{t("common.loading")}</p>}
      {data && !section && <p className="p-6 text-center text-lg font-bold">{t("nf.msg")}</p>}
      {data && section && (
        <>
          <button type="button" onClick={() => nav(`/m/picture-words/${section.id}/${items[0].id}`)}
            className="mb-4 min-h-16 w-full rounded-3xl text-2xl font-extrabold text-white shadow-soft active:scale-95" style={{ backgroundColor: section.color }}>
            ▶ {t("pw.cards")} · {items.length} {t("common.items")}
          </button>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {items.map((it, idx) => (
              <li key={it.id}>
                <button type="button" onClick={() => nav(`/m/${MODULE_ID}/${section.id}/${it.id}`)} aria-label={`${it.en} ${it.bnMeaning}`}
                  className="block w-full overflow-hidden rounded-3xl bg-white p-2 text-center shadow-soft active:scale-95">
                  <ItemPicture item={it} assets={data.assets} className="rounded-2xl" ratio={[4, 3]} priority={idx < 6} />
                  <div className="mt-2 text-lg font-extrabold uppercase leading-tight" style={{ color: section.color }}>{it.en}</div>
                  <div lang="bn" className="text-xl font-bold leading-snug">{it.bnMeaning}</div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}
