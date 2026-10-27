import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen, HomeLink } from "@/ui/shell";
import { BigTile, AudioButton, StarBurst, Confetti } from "@/ui/kit";
import { GameShell, type GameQuestion } from "@/ui/GameShell";
import { useT } from "@/i18n/strings";
import { enabledFor, useSettings } from "@/store/settings";
import { useProgress } from "@/store/progress";
import { speak } from "@/services/speech";
import type { Item } from "@/lib/schemas";
import { ItemPicture, MODULE_ID, usePW, type PWData } from "../data";
import { LoadError } from "../Sections";
import { buildMatch, buildQuestions, flipCard, resolveOpen, type MatchState } from "./engine";

const say = (it: Item, mode?: "en" | "bn" | "both") => speak({ en: it.en, bn: it.bnMeaning, audio: it.audio }, MODULE_ID, mode);

function useGameItems(data: PWData | null): Item[] {
  const enabled = useSettings((s) => s.enabledSections);
  return useMemo(() => {
    if (!data) return [];
    const ids = enabledFor(MODULE_ID, data.sections.map((s) => s.id), enabled);
    return ids.flatMap((id) => data.bySection[id] ?? []);
  }, [data, enabled]);
}

export function GamesMenu() {
  const t = useT();
  const nav = useNavigate();
  const stars = useProgress((s) => s.modules[MODULE_ID]?.stars ?? 0);
  const games = [
    { id: "findit", icon: "👂", title: t("games.findit"), desc: t("games.findit.desc"), color: "#d94a4a" },
    { id: "match", icon: "🃏", title: t("games.match"), desc: t("games.match.desc"), color: "#2b86c5" },
    { id: "which", icon: "🔤", title: t("games.which"), desc: t("games.which.desc"), color: "#8e5bbf" },
  ];
  return (
    <Screen title={t("games.title")} titleBn="খেলা" color="#2f9e8f" back="/m/picture-words" right={<><span className="rounded-full bg-black/25 px-3 py-1 text-lg font-extrabold">⭐ {stars}</span><HomeLink /></>}>
      <h2 className="mb-3 text-xl font-extrabold">{t("games.pick")}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {games.map((g) => (
          <BigTile key={g.id} color={g.color} onClick={() => nav(`/m/picture-words/games/${g.id}`)} className="flex min-h-32 items-center gap-4 p-5">
            <span className="text-6xl" aria-hidden>{g.icon}</span>
            <span><span className="block text-2xl font-extrabold">{g.title}</span><span className="block text-lg font-semibold">{g.desc}</span></span>
          </BigTile>
        ))}
      </div>
    </Screen>
  );
}

function FindIt({ items, data, round, onAgain, onExit }: { items: Item[]; data: PWData; round: number; onAgain: () => void; onExit: () => void }) {
  const t = useT();
  const questions = useMemo<GameQuestion[]>(() => buildQuestions(items, 8, 4).map((q) => ({
    id: q.id, answerId: q.answerId,
    onShow: () => void say(q.target, "en"),
    prompt: <AudioButton size={96} label={t("games.listen")} onClick={() => void say(q.target, "en")} />,
    options: q.options.map((o) => ({ id: o.id, label: o.en, node: <ItemPicture item={o} assets={data.assets} className="rounded-2xl" ratio={[4, 3]} /> })),
  })), [items, data, round]); // eslint-disable-line react-hooks/exhaustive-deps
  return <GameShell moduleId={MODULE_ID} questions={questions} onAgain={onAgain} onExit={onExit} />;
}

function WhichWord({ items, data, round, onAgain, onExit }: { items: Item[]; data: PWData; round: number; onAgain: () => void; onExit: () => void }) {
  const questions = useMemo<GameQuestion[]>(() => buildQuestions(items, 8, 3).map((q) => ({
    id: q.id, answerId: q.answerId,
    onShow: () => undefined,
    prompt: <div className="w-full max-w-sm rounded-3xl bg-white p-2 shadow-soft"><ItemPicture item={q.target} assets={data.assets} size={960} className="rounded-2xl" ratio={[4, 3]} /></div>,
    options: q.options.map((o) => ({
      id: o.id, label: o.en,
      node: <span className="flex min-h-16 flex-col items-center justify-center py-2"><span className="text-2xl font-black uppercase">{o.en}</span><span lang="bn" className="text-xl font-bold text-soft">{o.bnMeaning}</span></span>,
    })),
  })), [items, data, round]); // eslint-disable-line react-hooks/exhaustive-deps
  return <GameShell moduleId={MODULE_ID} questions={questions} layout="list" onAgain={onAgain} onExit={onExit} />;
}

function Match({ items, data, round, onAgain, onExit }: { items: Item[]; data: PWData; round: number; onAgain: () => void; onExit: () => void }) {
  const t = useT();
  const pairs = useSettings((s) => s.matchPairs);
  const addStars = useProgress((s) => s.addStars);
  const [state, setState] = useState<MatchState>(() => buildMatch(items, pairs));
  const [burst, setBurst] = useState(false);
  const timer = useRef(0);
  const awarded = useRef(false);
  useEffect(() => { setState(buildMatch(items, pairs)); awarded.current = false; }, [round]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (state.done && !awarded.current) { awarded.current = true; addStars(MODULE_ID, pairs); } }, [state.done]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function flip(uid: string) {
    const next = flipCard(state, uid);
    if (next === state) return;
    const card = state.cards.find((c) => c.uid === uid)!;
    void say(byId.get(card.itemId)!, "en");
    setState(next);
    if (next.open.length === 2) timer.current = window.setTimeout(() => setState((s) => resolveOpen(s)), 1000);
    else if (next.cards.filter((c) => c.matched).length > state.cards.filter((c) => c.matched).length) { setBurst(true); window.setTimeout(() => setBurst(false), 900); }
  }

  if (state.done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
        <Confetti show />
        <div className="text-7xl" aria-hidden>🏆</div>
        <h2 className="text-3xl font-extrabold">{t("games.great")}</h2>
        <p className="text-xl font-bold">{state.moves} {t("games.moves")} · ⭐ {pairs}</p>
        <button type="button" onClick={onAgain} className="min-h-16 w-full rounded-3xl bg-teal-bg text-2xl font-extrabold text-white shadow-soft">{t("games.playAgain")}</button>
        <button type="button" onClick={onExit} className="min-h-16 w-full rounded-3xl bg-white text-xl font-bold shadow-soft">{t("common.back")}</button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <StarBurst show={burst} />
      <p className="mb-3 text-center text-lg font-extrabold">{state.moves} {t("games.moves")} · {pairs} {t("games.pairs")}</p>
      <div className={`grid gap-3 ${pairs * 2 > 8 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
        {state.cards.map((c) => {
          const it = byId.get(c.itemId)!;
          const up = c.flipped || c.matched;
          return (
            <button key={c.uid} type="button" onClick={() => flip(c.uid)} aria-label={up ? (c.kind === "pic" ? it.en : `${it.en} ${it.bnMeaning}`) : "?"}
              className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl p-1 shadow-soft active:scale-95 ${up ? "bg-white" : "bg-teal-bg text-5xl text-white"} ${c.matched ? "ring-4 ring-leaf" : ""}`}>
              {!up ? <span aria-hidden>❓</span> : c.kind === "pic"
                ? <ItemPicture item={it} assets={data.assets} className="h-full w-full rounded-xl" ratio={[3, 4]} />
                : <span className="flex flex-col items-center px-1 text-center"><span className="text-lg font-black uppercase leading-tight">{it.en}</span><span lang="bn" className="text-base font-bold text-soft">{it.bnMeaning}</span></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayGame() {
  const { gameId } = useParams();
  const t = useT();
  const nav = useNavigate();
  const { data, error, retry } = usePW();
  const items = useGameItems(data);
  const [round, setRound] = useState(0);
  const exit = () => nav("/m/picture-words/games");
  const titles: Record<string, string> = { findit: t("games.findit"), match: t("games.match"), which: t("games.which") };
  const Game = gameId === "findit" ? FindIt : gameId === "match" ? Match : gameId === "which" ? WhichWord : null;
  return (
    <Screen title={titles[gameId ?? ""] ?? t("games.title")} color="#2f9e8f" back="/m/picture-words/games" right={<HomeLink />}>
      {error && <LoadError onRetry={retry} />}
      {!data && !error && <p className="p-6 text-center text-lg font-bold">{t("common.loading")}</p>}
      {data && Game && items.length >= 6 && <Game key={round} items={items} data={data} round={round} onAgain={() => setRound((r) => r + 1)} onExit={exit} />}
      {data && (!Game || items.length < 6) && <p className="p-6 text-center text-lg font-bold">{t("nf.msg")}</p>}
    </Screen>
  );
}
