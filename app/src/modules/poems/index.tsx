import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { Screen, HomeLink } from "@/ui/shell";
import { loadContentFile } from "@/services/content";
import { PoemsSchema, type Poem } from "@/lib/schemas";
import { speak, cancelSpeech } from "@/services/speech";
import { darken } from "@/lib/color";
import { assetUrl, isCrossOrigin } from "@/lib/assetUrl";
import { useT } from "@/i18n/strings";
import { ParentalGate } from "@/ui/ParentalGate";
import { isUnlocked, useGate } from "@/lib/gate";
import { useOnline } from "@/ui/shell";

const MODULE = "poems";
const COLOR = "#d6478a";

const usePoems = () => {
  const [poems, setPoems] = useState<Poem[] | null>(null);
  useEffect(() => { loadContentFile(MODULE, "poems.json", PoemsSchema).then(setPoems).catch(() => setPoems([])); }, []);
  return poems;
};

const CLASSES = [1, 2, 3, 4, 5];

function PoemList() {
  const t = useT();
  const poems = usePoems();
  const [grade, setGrade] = useState(0); // 0 = all classes
  const shown = (poems ?? []).filter((p) => !grade || p.grade === grade);
  return (
    <Screen title="Poems" titleBn="ছড়া" color={COLOR} back="/" right={<HomeLink />}>
      {poems && poems.length === 0 && <p className="p-6 text-center text-lg font-bold">{t("poems.none")}</p>}
      {!poems && <p className="p-6 text-center text-lg font-bold">{t("common.loading")}</p>}
      <div role="group" aria-label={t("poems.class")} className="mb-4 flex flex-wrap gap-2">
        {[0, ...CLASSES].map((g) => (
          <button key={g} type="button" aria-pressed={grade === g} onClick={() => setGrade(g)}
            className={`min-h-12 rounded-full px-5 text-lg font-extrabold shadow-soft active:scale-95 ${grade === g ? "bg-sun text-ink" : "bg-white"}`}>
            {g === 0 ? t("poems.all") : `${t("poems.class")} ${g}`}
          </button>
        ))}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id}>
            <Link to={`/m/poems/${p.id}`} className="flex min-h-28 items-center gap-4 rounded-3xl p-4 text-white shadow-soft active:scale-95"
              style={{ backgroundColor: darken(COLOR, 0.28) }}>
              <span className="text-6xl" aria-hidden>{p.emoji ?? "🎵"}</span>
              <span className="min-w-0">
                <span lang="bn" className="block text-2xl font-extrabold leading-tight">{p.titleBn}</span>
                <span className="block text-lg font-semibold">{p.titleEn}</span>
                {p.grade && <span className="mt-1 inline-block rounded-full bg-black/25 px-3 py-0.5 text-sm font-bold">{t("poems.class")} {p.grade}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}

/** Reads the poem line by line with the device's Bangla voice; tap any line to hear just that line. */
function PoemPlayer() {
  const { poemId } = useParams();
  const t = useT();
  const poems = usePoems();
  const poem = poems?.find((p) => p.id === poemId);
  const next = poems && poem ? poems[(poems.indexOf(poem) + 1) % poems.length] : undefined;
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [video, setVideo] = useState<"hidden" | "gate" | "shown">("hidden");
  const gateUntil = useGate((s) => s.until);
  const unlock = useGate((s) => s.unlock);
  const online = useOnline();
  const run = useRef(0);
  const lineEls = useRef<(HTMLParagraphElement | null)[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAt = useRef<number | null>(null); // when set, a single recorded line is playing and pauses at this time (s)

  const stop = useCallback(() => {
    run.current++; cancelSpeech(); stopAt.current = null;
    audioRef.current?.pause();
    setActive(-1); setPlaying(false);
  }, []);
  useEffect(() => stop, [stop, poemId]);
  useEffect(() => setVideo("hidden"), [poemId]);
  useEffect(() => { if (active >= 0) lineEls.current[active]?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [active]);

  if (!poems) return <Screen title={t("common.loading")} back="/m/poems"><p /></Screen>;
  if (!poem) return <Screen title={t("poems.title")} back="/m/poems"><p className="p-6 text-center text-lg font-bold">{t("poems.none")}</p></Screen>;

  // Recorded recitation (poem.audioKey -> poems/audio/<file>), with per-line start/end times; falls back to the device voice.
  const audioSrc = poem.audioKey ? assetUrl(MODULE, `audio/${poem.audioKey}`) : null;
  const lineAt = (sec: number) => poem.lines.findIndex((l) => sec * 1000 >= l.startMs && sec * 1000 < l.endMs);
  const getAudio = () => {
    if (!audioSrc) return null;
    if (!audioRef.current || audioRef.current.dataset.src !== audioSrc) {
      const a = new Audio();
      if (isCrossOrigin()) a.crossOrigin = "anonymous";
      a.preload = "auto"; a.src = audioSrc; a.dataset.src = audioSrc;
      a.ontimeupdate = () => {
        if (a.paused) return; // a trailing event after stop() must not re-highlight a line
        if (stopAt.current !== null && a.currentTime >= stopAt.current) { stop(); return; }
        setActive(lineAt(a.currentTime));
      };
      a.onended = () => stop();
      audioRef.current = a;
    }
    return audioRef.current;
  };
  const playRecorded = async (fromMs: number, toMs?: number): Promise<boolean> => {
    const a = getAudio();
    if (!a) return false;
    try {
      a.currentTime = fromMs / 1000;
      stopAt.current = toMs === undefined ? null : toMs / 1000;
      await a.play();
      return true;
    } catch { audioRef.current = null; return false; } // missing/unsupported file: use the device voice instead
  };

  const play = async (from = 0) => {
    stop();
    if (audioSrc) { setPlaying(true); setActive(from); if (await playRecorded(poem.lines[from]?.startMs ?? 0)) return; setPlaying(false); }
    const my = run.current;
    setPlaying(true);
    for (let i = from; i < poem.lines.length; i++) {
      if (my !== run.current) return;
      setActive(i);
      await speak({ bn: poem.lines[i].bn }, MODULE, "bn");
      if (my !== run.current) return;
      await new Promise((r) => setTimeout(r, 350)); // a breath between lines
    }
    if (my === run.current) { setActive(-1); setPlaying(false); }
  };
  const one = async (i: number) => {
    stop();
    setActive(i);
    if (audioSrc && (await playRecorded(poem.lines[i].startMs, poem.lines[i].endMs))) return;
    const my = run.current;
    await speak({ bn: poem.lines[i].bn }, MODULE, "bn");
    if (my === run.current) setActive(-1);
  };

  if (video === "gate") return <Screen title={poem.titleEn} titleBn={poem.titleBn} color={COLOR} back="/m/poems"><ParentalGate onPass={() => { unlock(); setVideo("shown"); }} onCancel={() => setVideo("hidden")} /></Screen>;

  return (
    <Screen title={poem.titleEn} titleBn={poem.titleBn} color={COLOR} back="/m/poems" right={<HomeLink />}>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 py-2">
        <div className="text-7xl" aria-hidden>{poem.emoji ?? "🎵"}</div>
        <button type="button" onClick={() => (playing ? stop() : void play())} aria-pressed={playing}
          className="min-h-16 w-full max-w-xs rounded-full bg-sun px-8 text-2xl font-extrabold text-ink shadow-soft active:scale-95">
          {playing ? `⏹ ${t("poems.stop")}` : `▶ ${t("poems.play")}`}
        </button>
        {poem.video && (
          <div className="flex w-full max-w-xl flex-col items-center gap-2">
            <button type="button" aria-expanded={video === "shown"}
              onClick={() => { if (video === "shown") setVideo("hidden"); else { stop(); setVideo(isUnlocked(gateUntil) ? "shown" : "gate"); } }}
              className="min-h-14 rounded-full bg-white px-6 text-xl font-extrabold shadow-soft active:scale-95">
              {video === "shown" ? `✕ ${t("poems.videoHide")}` : `🎬 ${t("poems.video")}`}
            </button>
            {video === "shown" && (online ? (
              <>
                <div className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-soft">
                  <iframe title={poem.video.title} className="h-full w-full" loading="lazy" allowFullScreen
                    src={`https://www.youtube-nocookie.com/embed/${poem.video.id}?rel=0&modestbranding=1&playsinline=1`}
                    allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
                </div>
                <p className="text-center text-sm font-semibold text-soft">{t("poems.videoNote")} · {t("poems.videoBy")}: {poem.video.channel}</p>
              </>
            ) : <p role="status" className="rounded-2xl bg-white p-4 text-center font-bold shadow-soft">{t("poems.videoOffline")}</p>)}
          </div>
        )}
        <p className="text-base font-semibold text-soft">{t("poems.tap")}</p>
        {poem.lines.map((l, i) => (
          <p key={i} ref={(el) => { lineEls.current[i] = el; }} lang="bn" role="button" tabIndex={0}
            onClick={() => void one(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void one(i); } }}
            className={`w-full cursor-pointer rounded-2xl px-4 py-3 text-center text-3xl font-bold leading-snug shadow-soft transition-colors ${i === active ? "bg-sun text-ink" : "bg-white"}`}>
            {l.bn}
            {l.en && <span lang="en" className="mt-1 block text-lg font-semibold text-soft">{l.en}</span>}
          </p>
        ))}
        {poem.source && <p className="mt-2 text-center text-sm font-semibold text-soft">{t("poems.source")}: {poem.source}</p>}
        {next && next.id !== poem.id && (
          <Link to={`/m/poems/${next.id}`} className="mt-2 flex min-h-14 items-center gap-2 rounded-full bg-white px-6 text-xl font-extrabold shadow-soft">
            <span aria-hidden>{next.emoji ?? "🎵"}</span><span lang="bn">{next.titleBn}</span><span aria-hidden>→</span>
          </Link>
        )}
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
