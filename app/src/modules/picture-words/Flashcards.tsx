import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/ui/shell";
import { FlashCard } from "@/ui/FlashCard";
import { PageSwipe } from "@/ui/kit";
import { useT } from "@/i18n/strings";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { cancelSpeech, speak } from "@/services/speech";
import { isCrossOrigin } from "@/lib/assetUrl";
import { ItemPicture, MODULE_ID, imgInfo, usePW } from "./data";
import { LoadError } from "./Sections";

/** true on phone-width screens: the picture gets a taller 4:3 crop so it fills more of the screen */
function usePhone() {
  const q = "(max-width: 767px)";
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener("change", on); return () => mq.removeEventListener("change", on); }, []);
  return m;
}

const loading = new Map<string, Promise<void>>();
/** resolves once the image is in the browser cache (or failed / took >10 s, so auto-play never stalls) */
function loadImage(src: string): Promise<void> {
  let p = loading.get(src);
  if (!p) {
    p = new Promise<void>((resolve) => {
      const img = new Image();
      if (isCrossOrigin()) img.crossOrigin = "anonymous";
      const done = () => resolve();
      img.onload = done; img.onerror = done;
      window.setTimeout(done, 10_000);
      img.src = src;
    });
    loading.set(src, p);
  }
  return p;
}

export default function Flashcards() {
  const { sectionId, itemId } = useParams();
  const t = useT();
  const nav = useNavigate();
  const { data, error, retry } = usePW();
  const markSeen = useProgress((s) => s.markSeen);
  const autoSecs = useSettings((s) => s.autoplaySeconds);
  const phone = usePhone();
  const [auto, setAuto] = useState(false);
  const [finished, setFinished] = useState(false);
  const runId = useRef(0);

  const section = data?.sections.find((s) => s.id === sectionId);
  const items = (sectionId && data?.bySection[sectionId]) || [];
  const index = Math.max(0, items.findIndex((i) => i.id === itemId));
  const item = items[index];

  const go = useCallback((to: number) => {
    if (!sectionId || !items.length) return;
    const n = Math.min(items.length - 1, Math.max(0, to));
    nav(`/m/${MODULE_ID}/${sectionId}/${items[n].id}`, { replace: true });
  }, [sectionId, items, nav]);

  const say = useCallback(() => { if (item) return speak({ en: item.en, bn: item.bnMeaning, audio: item.audio }, MODULE_ID); return Promise.resolve(); }, [item]);

  useEffect(() => { if (item && sectionId) markSeen(MODULE_ID, sectionId, item.id, items.length); }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelSpeech(), []);

  // keyboard: ←/→ change card, Space/Enter on the page (not on a focused button) speaks
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") { e.preventDefault(); setAuto(false); go(index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setAuto(false); go(index - 1); }
      else if (e.key === " " && tag !== "BUTTON" && tag !== "A") { e.preventDefault(); void say(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, say]);

  // preload the next few large images (and the previous one) so swiping / auto-play never shows a blank card
  const ready = useCallback((n?: typeof item) => {
    const info = n && data ? imgInfo(n, 960, data.assets) : null;
    return info ? loadImage(info.src) : Promise.resolve();
  }, [data]);
  useEffect(() => {
    for (const n of [items[index + 1], items[index + 2], items[index + 3], items[index - 1]]) void ready(n);
  }, [index, data]); // eslint-disable-line react-hooks/exhaustive-deps

  // auto-play: speak, wait, advance; stops on the last card
  useEffect(() => {
    if (!auto || !item) return;
    const my = ++runId.current;
    let timer = 0;
    // wait for this card's picture before speaking, and for the next card's picture before moving on
    void ready(item).then(() => (my === runId.current ? say() : undefined)).then(() => {
      if (my !== runId.current) return;
      timer = window.setTimeout(() => {
        if (my !== runId.current) return;
        if (index >= items.length - 1) { setAuto(false); setFinished(true); return; }
        void ready(items[index + 1]).then(() => { if (my === runId.current) go(index + 1); });
      }, autoSecs * 1000);
    });
    return () => { runId.current++; clearTimeout(timer); };
  }, [auto, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = `/m/${MODULE_ID}/${sectionId}`;
  if (error) return <Screen title="" back={back}><LoadError onRetry={retry} /></Screen>;
  if (!data || !section || !item) return <Screen title="…" back={back}><p className="p-6 text-center text-lg font-bold">{t("common.loading")}</p></Screen>;

  const arrow = "flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl font-black shadow-soft active:scale-90 disabled:opacity-30";
  return (
    <Screen wide title={section.nameEn} titleBn={section.nameBn} color={section.color} back={back}
      right={<span className="rounded-full bg-black/25 px-3 py-1 text-lg font-extrabold">{index + 1} {t("flash.of")} {items.length}</span>}>
      <PageSwipe onSwipe={(d) => { setAuto(false); go(d === "left" ? index + 1 : index - 1); }} className="mx-auto w-full">
        <FlashCard color={section.color} word={item.en} pron={item.bnPron} meaning={item.bnMeaning} onSpeak={() => void say()} speakLabel={`${t("flash.speak")}: ${item.en}`}
          picture={<ItemPicture item={item} assets={data.assets} size={960} priority fit={phone ? "cover" : "contain"} className="rounded-3xl bg-white" ratio={phone ? [5, 4] : !item.image ? [4, 3] : [item.image.w, item.image.h]} />} />
      </PageSwipe>
      {finished && <p role="status" className="mt-4 text-center text-2xl font-extrabold">{t("flash.done")}</p>}
      <div className="mx-auto mt-6 flex max-w-xl items-center md:max-w-3xl justify-between gap-3">
        <button type="button" className={arrow} aria-label={t("flash.prev")} disabled={index === 0} onClick={() => { setAuto(false); go(index - 1); }}>←</button>
        <button type="button" onClick={() => { setFinished(false); setAuto((a) => !a); }} aria-pressed={auto}
          className="min-h-16 flex-1 rounded-3xl bg-sun px-4 text-xl font-extrabold text-ink shadow-soft active:scale-95">
          {auto ? `⏸ ${t("flash.pause")}` : `▶ ${t("flash.auto")}`}
        </button>
        <button type="button" className={arrow} aria-label={t("flash.next")} disabled={index === items.length - 1} onClick={() => { setAuto(false); go(index + 1); }}>→</button>
      </div>
    </Screen>
  );
}
