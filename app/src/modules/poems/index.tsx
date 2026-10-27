import { useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import ComingSoon from "../ComingSoon";
import { Screen } from "@/ui/shell";
import { loadContentFile } from "@/services/content";
import { PoemsSchema, type Poem } from "@/lib/schemas";
import { speak, cancelSpeech } from "@/services/speech";
import { useT } from "@/i18n/strings";

const MODULE = "poems";
const usePoems = () => {
  const [poems, setPoems] = useState<Poem[] | null>(null);
  useEffect(() => { loadContentFile(MODULE, "poems.json", PoemsSchema).then(setPoems).catch(() => setPoems([])); }, []);
  return poems;
};

function PoemList() {
  const t = useT();
  const poems = usePoems();
  return (
    <ComingSoon moduleId={MODULE}>
      <h3 className="mt-2 text-xl font-extrabold">{t("soon.preview")}</h3>
      <ul className="flex w-full flex-col gap-3">
        {(poems ?? []).map((p) => (
          <li key={p.id}>
            <Link to={`/m/poems/${p.id}`} className="flex min-h-16 flex-col justify-center rounded-2xl bg-white px-5 py-3 text-left shadow-soft">
              <span lang="bn" className="text-xl font-extrabold">{p.titleBn}</span>
              <span className="text-soft">{p.titleEn}</span>
            </Link>
          </li>
        ))}
      </ul>
    </ComingSoon>
  );
}

/** Player: plays line by line (recorded audio via audioKey is wired later; text-only timing for now). */
function PoemPlayer() {
  const { poemId } = useParams();
  const t = useT();
  const poems = usePoems();
  const poem = poems?.find((p) => p.id === poemId);
  const [active, setActive] = useState(-1);
  const timers = useRef<number[]>([]);
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; cancelSpeech(); setActive(-1); };
  useEffect(() => stop, []);

  if (!poem) return <Screen title={t("common.loading")} back="/m/poems"><p /></Screen>;
  const play = () => {
    stop();
    poem.lines.forEach((l, i) => {
      timers.current.push(window.setTimeout(() => { setActive(i); void speak({ bn: l.bn }, MODULE, "bn"); }, l.startMs));
    });
    const end = poem.lines[poem.lines.length - 1]?.endMs ?? 0;
    timers.current.push(window.setTimeout(() => setActive(-1), end));
  };
  return (
    <Screen title={poem.titleEn} titleBn={poem.titleBn} color="#d6478a" back="/m/poems">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-4">
        {poem.lines.map((l, i) => (
          <p key={i} lang="bn" className={`w-full rounded-2xl px-4 py-3 text-center text-2xl font-bold transition-colors ${i === active ? "bg-sun text-ink" : "bg-white"}`}>
            {l.bn}{l.en && <span lang="en" className="block text-base font-semibold text-soft">{l.en}</span>}
          </p>
        ))}
        <button type="button" onClick={play} className="min-h-16 rounded-full bg-berry px-8 text-xl font-extrabold text-white shadow-soft">▶ Play</button>
      </div>
    </Screen>
  );
}

export default function Poems() {
  return (
    <Routes>
      <Route index element={<PoemList />} />
      <Route path=":poemId" element={<PoemPlayer />} />
    </Routes>
  );
}
